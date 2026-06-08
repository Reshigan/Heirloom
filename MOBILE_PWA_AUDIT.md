# Heirloom — Mobile & PWA Audit
Date: 2026-06-07

---

## 1. PWA Manifest (`/manifest.webmanifest`)

**File location:** `cloudflare/frontend/public/manifest.webmanifest`
(Note: SW precaches `/manifest.webmanifest` — correct. The old `manifest.json` path does not exist — no issue since the link in `index.html` correctly points to `.webmanifest`.)

| Field | Value | Status |
|---|---|---|
| `start_url` | `/loom/pwa?source=pwa` | PASS — lands authenticated users on the cloth |
| `display` | `standalone` | PASS |
| `display_override` | `["standalone", "minimal-ui"]` | PASS |
| `background_color` | `#0e0e0c` (ink) | PASS |
| `theme_color` | `#0e0e0c` (ink) | PASS |
| `id` | `/` | PASS |
| `orientation` | `natural` | PASS |
| 192×192 icon | present (`any` purpose) | PASS |
| 512×512 icon | present (`any` purpose) | PASS |
| maskable-192 icon | present (`maskable` purpose) | PASS |
| maskable-512 icon | present (`maskable` purpose) | PASS |
| SVG icon (`any`) | present | PASS |
| `screenshots` | only `wide` form_factor (1200×630) | MEDIUM — see below |

**MEDIUM — Missing `narrow` screenshot.** Chrome on Android shows an install bottom sheet preview using the `narrow` (portrait) screenshot. Only a `wide` screenshot is declared; Android install prompt will have no preview image. Add a 390×844-ish portrait screenshot with `"form_factor": "narrow"`.

---

## 2. Service Worker (`public/sw.js`)

| Check | Result |
|---|---|
| Cache version | `heirloom-v56` — current |
| Precache includes main shell files | PASS — `/`, `/index.html`, `/manifest.webmanifest`, `/favicon.svg`, `/icon.svg`, both 192 and 512 icons, `/offline`, `/offline-boot.js`, `/splash-boot.js`, `/theme-boot.js` |
| Offline fallback | PASS — `offline.html` + `offline-boot.js` exist in public; fallback chain: network → cached shell → `/offline` |
| Navigation strategy | Network-first with shell fallback |
| Static assets strategy | Cache-first (hashed `/assets/*`) |
| `/api/*` strategy | Network-first with `API_CACHE` fallback for GET reads; non-GET untouched |
| Push event handler | PASS — renders notification with icon, badge, tag, deep-link route |
| `notificationclick` handler | PASS — focuses existing tab or opens `/loom/pwa` |
| Background sync | PASS (relay only) — `hl-queue-sync` relays to open clients; **explicitly documented** as no-op when app is closed (no closed-app sync yet) |
| `SKIP_WAITING` message | PASS |
| `CLEAR_API_CACHE` on logout | PASS |

**LOW — Background sync is relay-only (open tabs).** When the app tab is closed, `clients.matchAll()` returns empty and the relay is a no-op. Offline queue entries will not drain until the user opens the app. This is documented in the code as a known limitation. No action required unless closed-app sync is a hard requirement.

---

## 3. iOS PWA Meta Tags (`index.html`)

| Tag | Present | Value |
|---|---|---|
| `apple-touch-icon` | YES | `/icons/apple-touch-icon.png?v=20260602` |
| `apple-mobile-web-app-capable` | YES | `yes` |
| `apple-mobile-web-app-status-bar-style` | YES | `black-translucent` |
| `apple-mobile-web-app-title` | YES | `Heirloom` |
| `apple-touch-startup-image` | NO | — |
| `viewport` | YES | `width=device-width, initial-scale=1.0, viewport-fit=cover` |
| `theme-color` | YES | `#0e0e0c` |

**HIGH — `apple-touch-icon` is 192×192, not 180×180.** Apple specifies 180×180 as the canonical size for `apple-touch-icon` on modern iPhones. iOS will scale it down but there may be minor softness on the home screen icon on Retina devices. Regenerate at exactly 180×180.

**MEDIUM — No `apple-touch-startup-image`.** iOS Safari does not use the manifest `background_color` for the launch splash; without explicit startup image link(s), the launch screen on iOS shows a white flash before the app shell renders. This is distinct from the in-app `#hl-splash` / `splash-boot.js` (which handles the React mount delay) — the OS-level launch splash is separate. Adding a 2×2 px PNG in the correct ink color (`#0e0e0c`) as a universal startup image would eliminate the white flash. Not critical for function, but visible on cold-start.

---

## 4. Safe Area / Notch Clearance (`globals.css` + `BottomNav.tsx`)

**PASS — comprehensive coverage.**

`globals.css` uses `env(safe-area-inset-*)` in:
- A utility class with full four-side padding (bottom, top, left, right)
- `.loom main` padding-bottom: `calc(64px + env(safe-area-inset-bottom, 0px))`
- Composer bottom offset: `calc(72px + env(safe-area-inset-bottom, 0px))`
- Top clearance: `calc(18px + env(safe-area-inset-top, 0px))`

`BottomNav.tsx` uses `env(safe-area-inset-bottom, 0px)` directly in inline styles for both the nav `height` and `paddingBottom`. Correct pattern — nav body extends to screen edge, content inside respects the indicator zone.

`viewport-fit=cover` is set in `index.html` — required for `env(safe-area-inset-*)` to take effect. PASS.

---

## 5. `BottomNav.tsx` — Home Indicator Clearance

**PASS.** The nav uses:
```
height: 'calc(64px + env(safe-area-inset-bottom, 0px))'
paddingBottom: 'env(safe-area-inset-bottom, 0px)'
```
Content area clears via `.loom main { padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)) }` in globals.css. iPhone home indicator is correctly accommodated.

**LOW — Nav tap targets.** The five nav items use `flex: 1` across a 64px-height bar. On a 375px-wide phone each item is ~75px wide and 64px tall (before the safe-area padding). This meets the 44px minimum per the recent mobile fix (d3aee79), but the touch area is constrained by the flex layout. No change needed unless testing reveals missed taps.

---

## 6. Capacitor / Mobile App (`mobile/`)

**The mobile app is Expo (React Native), not Capacitor.** There is no `capacitor.config.json` or `capacitor.config.ts`. CLAUDE.md references Capacitor but the actual implementation is Expo + EAS. No `webDir` configuration exists or is needed — Expo builds native bundles, not a web wrapper.

| Config | Value | Status |
|---|---|---|
| Framework | Expo SDK (React Native) | — |
| Build system | EAS (`eas.json`) | — |
| Bundle ID | `com.heirloom.blue` | PASS |
| Android `edgeToEdgeEnabled` | `true` | PASS — Android 15+ edge-to-edge compliance |
| `newArchEnabled` | `true` | PASS — React Native new architecture |
| API base URL | `https://api.heirloom.blue/api` (hardcoded) | MEDIUM — see below |
| Splash `backgroundColor` | `#0a0c10` | LOW — see below |

**MEDIUM — API URL hardcoded, no environment switching.** `mobile/src/services/api.ts` sets `API_URL = 'https://api.heirloom.blue/api'` as a literal constant with no env variable or config abstraction. Development builds hit the production API. Add an `app.config.js` (or use `expo-constants` + EAS environment variables) to switch between `localhost`, staging, and production.

**LOW — Splash `backgroundColor` is `#0a0c10`, not ink `#0e0e0c`.** The canonical ink token is `#0e0e0c`; the mobile app uses `#0a0c10` in both the iOS splash config and the Android adaptive icon background. Visually near-identical but inconsistent with the design constitution. Update `app.json` to `#0e0e0c`.

**LOW — `splash-icon.png` is 200×200.** Expo recommends a 1284×2778 PNG (or at minimum 1242×2688) for the splash screen image so it fills the full screen on large iPhones without upscaling blur. The current 200×200 asset will be heavily upscaled by the OS. Regenerate at ≥1242×2688 with the Heirloom mark centered on an ink background.

**LOW — `icon.png` lacks alpha (required for iOS App Store).** The iOS App Store requires a 1024×1024 PNG with no alpha channel for the App Store icon. `icon.png` is currently a standard RGB PNG (37 KB). Verify it has no alpha — if it does, flatten it to RGB before submission (`file` shows RGB but `file` can miss embedded alpha). The maskable icons have RGBA — those are fine for Android.

---

## 7. Push Notifications (VAPID)

**PASS (dormant — by design).** Worker at `cloudflare/worker/src/index.ts` imports `push-notifications` routes and `pushSender` service. The push route is mounted at `protectedApp.route('/push', ...)`. VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) are declared as optional Worker env bindings — absent → dormant.

Frontend `webPush.ts` checks `!!VITE_VAPID_PUBLIC_KEY` before exposing any push UI (`webPushEnabled()` gates everything). The SW `push` event handler is fully implemented.

The worker's scheduled handler processes the push queue and cleans old notifications on the cron trigger.

**To activate:** add `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` as Cloudflare Worker secrets, and `VITE_VAPID_PUBLIC_KEY` to the Cloudflare Pages build environment. No code changes needed.

---

## 8. Icon Files

| File | Actual dimensions | Declared in manifest | Status |
|---|---|---|---|
| `icon-192.png` | 192×192 (RGB, 1.3 KB) | `192x192, any` | PASS |
| `icon-512.png` | 512×512 (RGB, 3.8 KB) | `512x512, any` | PASS |
| `icon-maskable-192.png` | 192×192 (RGBA, 7.2 KB) | `192x192, maskable` | PASS |
| `icon-maskable-512.png` | 512×512 (RGBA, 14 KB) | `512x512, maskable` | PASS |
| `apple-touch-icon.png` | 192×192 (1.3 KB) | n/a (linked in `<head>`) | HIGH — should be 180×180 |

**CRITICAL concern — icon file sizes are suspiciously small.** `icon-192.png` at 1.3 KB and `icon-512.png` at 3.8 KB for RGB PNGs of those dimensions are extremely small — a solid-color or nearly-blank PNG would produce these sizes. A real full-color 192×192 icon would typically be 10–80 KB. Verify the icons render correctly as installed home-screen icons; they may be placeholder/blank assets. The maskable icons (7.2 KB / 14 KB) are more plausible in size.

---

## Summary by Severity

### CRITICAL
- **Icon files may be blank/placeholder.** `icon-192.png` (1.3 KB) and `icon-512.png` (3.8 KB) are implausibly small for full-color PNGs. Visually verify the installed PWA home-screen icon is not blank or a solid color.

### HIGH
- **`apple-touch-icon` is 192×192, not 180×180.** iOS canonical size is 180×180. Regenerate.

### MEDIUM
- **No `narrow` form_factor screenshot in manifest.** Android install bottom sheet shows no preview. Add a portrait screenshot (~390×844).
- **No `apple-touch-startup-image`.** Cold-start white flash on iOS before app shell renders. Add a minimal startup image at ink color.
- **Mobile API URL hardcoded to production.** No env switching for dev/staging. Refactor to use EAS env variables.

### LOW
- **Mobile splash background color mismatch** (`#0a0c10` vs canonical ink `#0e0e0c`).
- **Mobile `splash-icon.png` is 200×200.** Will be upscaled/blurry on full-screen launch. Regenerate at ≥1242×2688.
- **Background sync relay is open-tab-only.** Documented limitation; no action until closed-app sync is prioritized.
- **BottomNav touch target size** — meets 44px minimum but is tight at 64px height with no extra hit area.
- **CLAUDE.md incorrectly says mobile stack is Capacitor** — it is Expo. Update CLAUDE.md for accuracy.
