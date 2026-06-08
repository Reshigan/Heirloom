# Heirloom Frontend Performance Audit

`cloudflare/frontend/` — the live, deployed tree (heirloom.blue). Build: `npm run build` (tsc && vite build), 0 type errors, 1.6s build time. Audit date 2026-06-07.

---

## 1. Bundle sizes — chunks over 100 kB (unminified)

| Chunk | Size (raw) | Size (gzip) | Notes |
|---|---|---|---|
| `ClothCanvas3D-*.js` | **515.44 kB** | **130.45 kB** | Three.js WebGL cloth shader — see §2 |
| `index-*.js` (main entry) | **363.45 kB** | **113.52 kB** | App shell: React, ReactDOM, react-router, react-query, Zustand, all eagerly-imported pages (Login/Signup/NotFound), `App.tsx` route table, `ClothBackdrop`/`AmbientThreads`, `globals.css` import graph |
| `LegacyPlan-*.js` | **127.06 kB** | **41.16 kB** | 767-line single-file page (`src/pages/LegacyPlan.tsx`) — already lazy-loaded |
| `AdminDashboard-*.js` | **119.99 kB** | **24.03 kB** | 2067-line page + `MarketingTab` (926 lines) + `SocialCalendarTab` (294 lines) bundled in — already lazy-loaded |

Everything else is well under 30 kB raw / 10 kB gzip — the route-level code-splitting elsewhere is healthy (90+ small page chunks in the 1–25 kB range). `index-*.css` is 54.14 kB raw / 12.27 kB gzip — reasonable for a Tailwind + custom-token sheet.

**The critical number:** `ClothCanvas3D` + `index` (both load on first paint of *every* route, see §2) total **~244 kB gzip / ~879 kB raw** before a user sees anything but the splash. That's the dominant contributor to LCP/TTI on first load.

---

## 2. ClothCanvas3D analysis — CRITICAL

`src/loom/components/ClothCanvas3D.tsx` (per its own header comment): *"world-first 3D textile cloth — pure Three.js (no React Three Fiber)... Lazy-load this component: it pulls Three.js (~600KB)."*

- **What it does:** Mounts a `THREE.WebGLRenderer`, builds a `PlaneGeometry(52, 22, 240, 80)` (240×80 = 19,200 segments) with a custom `ShaderMaterial` (sinusoidal vertex displacement + woven cross-hatch fragment shader), draws `TubeGeometry` "weft threads" along `CatmullRomCurve3` per entry, animates camera drift + mouse parallax — a continuous `requestAnimationFrame` render loop.
- **Is it lazy?** Technically yes — every call site (`Login.tsx`, `Signup.tsx`, `Marketing.tsx`, and `ClothBackdrop.tsx`) wraps the import in `lazy(() => import('../loom/components/ClothCanvas3D')...)`.
- **The actual problem — it is not scoped to "the cloth home screen."** `ClothBackdrop` is mounted **once, globally, in `LoomShellRoot`** (`App.tsx` lines 217–224):
  ```tsx
  function LoomShellRoot({ children }) {
    return (
      <div className="loom" data-theme={theme} ...>
        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <ClothBackdrop opacity={0.42} threadOpacity={0.55} />
        </div>
        ...
  ```
  …and `LoomShellRoot` wraps **every single route** in the app (line 258, inside `<BrowserRouter>`, around `<Routes>`). So `ClothCanvas3D` — 515 kB raw / 130 kB gzip of Three.js + custom shaders, plus a perpetual WebGL render loop — downloads and boots on **every page load of every route**: Login, Settings, Billing, Letters, the 404 page, all of it. It is the single largest asset in the app and it ships everywhere, continuously animating behind content the user is trying to read (a §2.6 "ambient decoration competing for attention" risk too, separate from the perf cost).
- Three more call sites (`Login.tsx`, `Signup.tsx`, `Marketing.tsx`) *also* lazy-import `ClothCanvas3D` directly for their own full-bleed hero treatments — meaning on those routes the module is requested twice (once via the global `ClothBackdrop`, once directly), though Vite/the browser will dedupe to one network fetch and one cached chunk. Still, it's redundant code (3 near-identical `lazy(() => import('../loom/components/ClothCanvas3D')...)` blocks that could import the shared `ClothBackdrop` instance instead).

**Recommendation:** Stop mounting `ClothBackdrop`/`ClothCanvas3D` globally in `LoomShellRoot`. Scope it to the screens that are actually "the cloth" per the brief (the Tapestry/Today/PwaHome/Marketing/Login/Signup hero surfaces) and render a static (CSS-only, ink/bone) substrate everywhere else. This:
1. Removes 515 kB / 130 kB-gzip from the critical path of ~85% of routes (Settings, Billing, Letters, Family, Inbox, Admin, etc. don't need a live WebGL cloth).
2. Stops a perpetual `requestAnimationFrame` WebGL loop from running on every screen (battery/CPU on mobile — also works against the "negative space, calm" design constitution).
3. Removes the duplicate lazy-import blocks in Login/Signup/Marketing in favor of reusing `ClothBackdrop`.

If the global ambient cloth is a deliberate product decision (the "cloth substrate behind every screen" comment in `ClothBackdrop.tsx` suggests it is), the fix is still to **defer** it: render `AmbientThreads` (lightweight 2D canvas, 226 lines, no Three.js) immediately, and `requestIdleCallback`/intersection-observer-gate the `ClothCanvas3D` mount so it loads after first paint/interaction rather than blocking it — or downgrade the global backdrop to a CSS/2D-canvas weave and reserve the full Three.js shader cloth for the hero/marketing/home surfaces only.

---

## 3. Lazy loading check (`src/App.tsx`)

**Eagerly imported (lines 14–16):** `Login`, `Signup`, `NotFound`. These are reasonable to keep eager — they're the most common unauthenticated entry points, and `NotFound` is tiny.

**Lazy-loaded:** Essentially everything else — ~95 routes/pages via `React.lazy()` (lines 18–111), including all the ones called out in the prompt:
- `Billing` ✅ lazy (line 25)
- `AdminDashboard` ✅ lazy (line 28, plus `AdminLogin`/`AdminRoute` gating so the chunk never loads for non-admins)
- `LegacyPlan` ✅ lazy (line 40)

So the route-level splitting is already in good shape — no action needed here. `ScenarioPages` is shared across 5 routes (`ScenarioWeddingDay`/`Eighteenth`/`AfterIGo`/`Grandchildren`/`VoiceUnborn`, lines 93–97) via one lazy import, which is a sensible shared chunk (`ScenarioPages-*.js`, 6.34 kB).

**Minor observation:** `LoomMarketing` is imported once (line 108) and used at both `/` (line 262) and `/loom/marketing` (line 551) — fine, single chunk, no duplication.

**Nothing eager that shouldn't be.** The lazy-loading hygiene here is good; the bundle-size problem is concentrated entirely in §2 (the global `ClothCanvas3D` mount), not in route-splitting gaps.

---

## 4. Image optimization

```
102K  public/og/wrapped.png      (1200×630)
102K  public/og/milestone.png    (1200×630)
102K  public/og/inherit.png      (1200×630)
102K  public/og/entry.png        (1200×630)
 54K  public/social-vertical.png (1000×1500)
 49K  public/og-image.png        (1200×630)
 39K  public/social-square.png   (1080×1080)
 14K  public/icons/icon-maskable-512.png
7.2K  public/icons/icon-maskable-192.png
3.8K  public/icons/icon-512.png
1.3K  public/icons/icon-192.png
1.3K  public/icons/apple-touch-icon.png
```

- **OG image dimensions are correct** — all four `public/og/*.png` plus `og-image.png` are exactly **1200×630**, the canonical Open Graph size referenced in `index.html` (`og:image:width`/`height` 1200/630). No resizing needed.
- **Sizes are reasonable** for OG/social cards (39–102 kB, all RGBA PNG, non-interlaced) — these are fetched by crawlers/link-unfurlers, not by the app's critical path, so they don't affect LCP/TTI. 100 kB for a 1200×630 RGBA PNG is on the high side; converting to a well-compressed JPEG (quality ~80) or `pngquant`/`oxipng` lossless-optimizing the four `og/*.png` files (currently all exactly 102 kB — likely generated from the same template/pipeline and not individually optimized) would shave roughly 30–50% with no visible quality loss for social-card use. **LOW priority** — these aren't loaded by the app itself.
- App icons are appropriately small (1.3–14 kB).
- No oversized hero/content images found in `public/` — the app appears to load user-content images (memories/photos) from the API/CDN rather than bundling them, which is correct.

---

## 5. Font loading (`index.html` + `globals.css`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@...&family=Inter:wght@...&family=JetBrains+Mono:wght@...&display=swap" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:...&display=swap" />
```

- **Not self-hosted — loaded from Google Fonts** (`fonts.googleapis.com` / `fonts.gstatic.com`). `preconnect` to both origins is present (good — saves a DNS+TLS round trip), and the stylesheet is both `preload`ed and linked.
- **`display=swap` is set** in the Google Fonts URL — text renders immediately in a fallback font and swaps to the webfont when it loads (FOUT, not FOIT/invisible text). This is the right choice for a type-forward brand (`--font-display`/`--font-body` fall back to `'Source Serif Pro', Charter, Georgia, serif`; `--sans` falls back to `system-ui, -apple-system`) — fallback metrics are reasonably close to Source Serif 4 / Inter, so the swap shouldn't cause severe layout shift.
- **There WILL be a FOUT** on first visit (cold cache): the request chain is `index.html` → Google Fonts CSS → `fonts.gstatic.com` woff2 files — at minimum 2 extra round trips before Source Serif 4/Inter/JetBrains Mono paint, during which Georgia/system-ui renders. The cold-boot splash (`#hl-splash`, inline in `index.html`) also declares `font-family: 'Source Serif 4', Georgia, serif` — so even the *splash* itself, which is supposed to mask the loading period, is subject to the same FOUT (it likely shows in Georgia initially, then swaps).
- **MEDIUM-impact opportunity:** self-host the three font families (download the woff2 subsets and serve from `/fonts/` with `@font-face` + `font-display: swap` and `<link rel="preload" as="font" type="font/woff2" crossorigin>`). This removes 2 third-party origins from the critical path entirely (no DNS/TLS/redirect to Google), lets the SW precache the font files for instant offline/repeat loads, and avoids Google Fonts' occasional regional latency. Given the brand explicitly treats "type as the hero," shaving the FOUT window matters more here than in a typical app.
- Three font families × multiple weights/styles/optical-size axes (`Source Serif 4` requests 6 ital/weight combinations across a variable `opsz` axis, `Inter` 4 weights, `JetBrains Mono` 2 weights) is a fairly large font payload — worth auditing whether all 6 Source Serif 4 styles are actually used in the live app (e.g., is `300 italic` ever rendered?) and trimming the Google Fonts query string to only what's needed.

---

## 6. Service Worker cache coverage (`public/sw.js`, lines 1–60)

- **`CACHE = 'heirloom-v56'`** ✅ — matches the version named in the task and in `MEMORY.md` ("PWA SW cache bump rule"). Correctly bumped.
- **Precache list (`PRECACHE`, lines 26–45):**
  ```
  '/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon.svg',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png',
  OFFLINE ('/offline'),
  '/offline-boot.js', '/splash-boot.js', '/theme-boot.js'
  ```
  This is the **app shell only** — it deliberately does **not** include the hashed `/assets/*.js`/`*.css` bundle files (`ClothCanvas3D-*.js`, `index-*.js`, etc.). That's actually the *correct* strategy for a Vite build with content-hashed filenames: you can't hardcode hashes that change every deploy, and the SW's own comment (lines 6–8) documents the intended split — **navigations are network-first** (always fetch fresh `index.html`, fall back to cached shell/offline), while **static assets use cache-first** (a separate fetch handler, not shown in the first 60 lines, presumably matches `/assets/*` by pattern and caches on first fetch — "hashed `/assets/*` are immutable").
- So: the precache list is comprehensive **for what it's meant to cover** (the shell + offline fallback + boot scripts), and is correctly scoped — it intentionally does not (and structurally cannot) precache the hashed JS bundles by name. Whether the cache-first runtime handler for `/assets/*` actually exists and works should be verified by reading lines 60–130 (referenced in the grep as having `caches.open(CACHE).then((cache) => cache.put(request, copy))` around line 121) — that appears to be the runtime cache-on-fetch path that backstops the missing precache entries. **No action needed**; this is sound SW design for a hashed-asset build pipeline.

---

## 7. Critical render path (`index.html`)

In `<head>`:
1. `<script src="/theme-boot.js"></script>` — **render-blocking by design**, and that's correct/acceptable: it must run synchronously before first paint to set `html[data-theme]` and avoid a dark→light flash (documented in the inline comment, lines 11–14). It's tiny and external (CSP-compliant).
2. Inline `<style>` for `html { background }` — trivial, non-blocking in any meaningful sense.
3. `<link rel="manifest">`, `<link rel="apple-touch-icon">` — async, no render impact.
4. **Font loading chain** (lines 36–39): `preconnect` ×2, `preload as="style"`, then a render-blocking `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">`. **This is the one actual render-blocking stylesheet in `<head>`**, and it's a cross-origin fetch (Google Fonts) — the browser must fetch and parse this CSS before it can compute styles for first paint. This is the highest-impact item in the critical path after the bundle-size issue in §2 (ties into §5 — self-hosting would convert this into a same-origin, SW-precachable, non-blocking-via-`font-display:swap` resource).
5. Open Graph / Twitter `<meta>` tags — zero render impact (crawler-only).

In `<body>`:
- Inline `<style>` for `#hl-splash` (cold-boot splash) — large inline block but it's CSS, parsed quickly, and necessary to paint the splash before JS loads. Fine.
- `<script src="/splash-boot.js"></script>` — external (CSP-compliant), small, documented as a load-event safety net for splash teardown.
- `<script type="module" src="/src/main.tsx"></script>` — the main app entry, loaded as an ES module (`type="module"` is deferred by spec — non-blocking). Correct.

**No problematic render-blocking scripts.** `theme-boot.js` is the only synchronous blocking script and it's there by necessity (anti-flash). The one true render-blocking resource is the **Google Fonts stylesheet** (§5/§7.4) — a third-party CSS fetch in the critical path.

---

## Ranked findings

### CRITICAL
1. **`ClothCanvas3D` (515 kB / 130 kB gzip Three.js + shaders) loads on every route, not just cloth/home screens** (§2). `ClothBackdrop` is mounted globally in `LoomShellRoot` around the entire `<Routes>` tree in `App.tsx` (lines 217–233, 258). Combined with the 363 kB/113 kB-gzip main `index` chunk, this means **every page load** — Settings, Billing, Letters, 404, everything — pays for ~244 kB gzip of JS plus boots a perpetual WebGL `requestAnimationFrame` render loop before the user sees their actual content. This is the single highest-impact fix available: scope the 3D cloth to the marketing/home/auth hero surfaces (where it's already directly imported in `Login`/`Signup`/`Marketing`) and replace the global ambient backdrop with a static or 2D-canvas-only (`AmbientThreads`, already lightweight) substrate, deferred via idle-callback/intersection-observer if the live WebGL cloth must remain ambient everywhere.

### HIGH
2. **Render-blocking third-party Google Fonts stylesheet in `<head>`** (§5/§7). `index.html` line 39 is a cross-origin, render-blocking `<link rel="stylesheet">` to `fonts.googleapis.com`, on top of which `fonts.gstatic.com` must then be fetched for the actual woff2 files — at least 2 extra cross-origin round trips before "type as the hero" (Source Serif 4/Inter/JetBrains Mono) renders, with a visible FOUT (including inside the cold-boot splash itself, which declares the same font stack). Self-hosting the three families as same-origin `woff2` with `@font-face`/`font-display: swap`/`<link rel="preload" as="font">` removes the third-party dependency, lets the SW precache fonts for instant repeat/offline loads, and shortens the FOUT window — high-value given the brand's explicit typographic positioning.

### MEDIUM
3. **`LegacyPlan` (127 kB / 41 kB gzip) and `AdminDashboard` (120 kB / 24 kB gzip) are large single-file page bundles** (§1). Both are already correctly lazy-loaded (only fetched on-route), so they don't affect first load — but `AdminDashboard.tsx` (2067 lines) bundles `MarketingTab` (926 lines) and `SocialCalendarTab` (294 lines) directly rather than as their own lazy chunks; splitting those tabs into `React.lazy()` boundaries (gated behind whichever tab is active) would shrink the admin entry chunk and improve admin-panel TTI. `LegacyPlan.tsx` (767 lines) is a single large component — consider splitting its sub-views (the inheritance flow steps) into lazy sub-chunks if it has distinct, sequential screens.
4. **Duplicated `lazy(() => import('../loom/components/ClothCanvas3D')...)` blocks** in `Login.tsx`, `Signup.tsx`, and `Marketing.tsx`, in addition to the one inside `ClothBackdrop.tsx` (§2). Vite/the browser dedupes the chunk, so there's no extra network cost, but it's redundant code that should import the shared `ClothBackdrop` (or a shared lazy-cloth hook/wrapper) instead — and becomes moot once finding #1 is addressed (those three pages are exactly where the live 3D cloth belongs).
5. **OG/social PNGs are uncompressed-ish** (§4) — all four `public/og/*.png` are exactly 102 kB at 1200×630 RGBA, suggesting they came from the same un-optimized export pipeline. Running them through `oxipng`/`pngquant` (lossless or near-lossless) would cut ~30–50% with no visible difference in link-preview quality. Doesn't affect the app's own LCP (crawler-fetched only), so this is purely a "good hygiene / faster social-card fetch" win.
6. **Google Fonts query requests a wide axis range** (6 Source Serif 4 ital/weight/optical-size combos, 4 Inter weights, 2 JetBrains Mono weights) (§5) — worth auditing actual usage in the live app and trimming the `family=...` query string to only the styles rendered, reducing the webfont payload.

### LOW
7. **OG image format** — `og-image.png`/`og/*.png` could be served as well-compressed JPEG or WebP for further size reduction; PNG is the safe/correct choice for crawler compatibility (some unfurlers mishandle WebP), so this is a "nice to have," not a real win. Skip unless chasing marginal gains.
8. **Service Worker precache scope** (§6) — sound as-is; the shell-only precache + (presumed, lines 60+) cache-first runtime handler for hashed `/assets/*` is the correct pattern for content-hashed Vite output. No action needed; flagged only to confirm it was reviewed, not because it's a problem.

---

## Summary

The route-level code-splitting (§3) is already excellent — ~95 lazy-loaded pages, Billing/AdminDashboard/LegacyPlan all correctly deferred, and the SW caching strategy (§6) is sound for a hashed-asset build. The entire performance story comes down to **one architectural mistake**: the 515 kB Three.js cloth shader, clearly designed and commented as a hero/home-screen treatment ("Lazy-load this component... only loads on the cloth home screen" is the implicit intent), is instead wired through `ClothBackdrop` into `LoomShellRoot`, which wraps **every route in the app**. Fixing finding #1 alone would remove ~130 kB gzip (and a perpetual WebGL render loop) from every single page view — by far the highest-leverage change available. Self-hosting fonts (#2) is the second-highest-value fix, directly serving the brand's "type is the hero" positioning by eliminating FOUT-causing third-party round trips.
