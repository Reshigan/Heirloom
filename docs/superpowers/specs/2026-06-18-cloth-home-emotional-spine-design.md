# Cloth-Home + Emotional Spine + Bench-to-10 — Design

> Date 2026-06-18. Live tree: `cloudflare/frontend/`. Build gate: `npm run build` (tsc && vite).
> Three converging tracks: **IA restructure** (user msg A), **more colour / contrast** (user msg B),
> **emotional spine** ("make the psyche go wow this is important"), folding in the **round-13 re-bench**
> defects (craft 5 / future 4 → drive to 10/10).

## Locked decisions (user-approved this session)

- **Colour/ground:** Paper ground default + elevate the 10-dye palette to a visible colour layer; copper stays the lone accent (<3% surface).
- **Letter:** Consolidate composer only — one Memory composer (text+photos+speak). Remove the letter nav item and the `?as=letter` compose mode. **KEEP** letter receiving/reading + future-dated / time-capsule delivery (untouched files).
- **Bottom bar:** `cloth · memory · ∞ · voice · profile`.
- **Emotional spine:** build all three — Inheritance Horizon (home), Witness (composer), Seal (commit).

## Hard constraints (carried)

- **Rule 2 / copper:** copper is signal only — NEVER fill/disc/glow/aura/radial/box-shadow/text-shadow; max = ≤1px stroke or text colour. **The Seal gesture must obey this** — square geometry, radius 0, dye- or bone-filled progress, NO copper halo/disc/ring.
- **Pricing LOCKED:** Family $6.99/$69, Founder $249, Free $0 (1-thread/500MB). ZAR path untouched. Pricing fix = route through `PLAN_FEATURES` + restore the 5-member cap display only — never amounts.
- **Don't lose functionality.** Append-only is server-enforced; do not weaken it.
- Type law: Cormorant display-only ≥24px (`--serif-display`), Spectral body/inputs (`--serif` / `.hl-input`), Space Mono labels (`--mono`). One easing `--ease`; durations 180/360/720/1400ms; radius 0.

## Contracts (file ownership — disjoint, no two agents share a file)

**Foundation files**
- `src/App.tsx` — default authed redirect `/loom/today` → `/loom/weft`; add lazy import + route `/loom/profile` → `Profile` (`src/pages/Profile.tsx` exporting `function Profile()`). Keep all letter-receiving routes.
- `src/loom/theme.ts` + `public/theme-boot.js` — default `'dark'` → `'light'`; status-bar meta default light.
- `src/styles/globals.css` — delete dead `.hl-infinity-3d` (+ float keyframes) and dead skeleton shimmer; extend Cormorant ≥24px floor / `.hl-serif` escape to cover h1–h3 cleanly.

**Implementation files (each owned by exactly one agent)**
- `src/loom/components/BottomNav.tsx` — NAV = cloth `/loom/weft` · memory `/compose` · ∞ `/loom/index`(center) · voice `/record` · profile `/loom/profile`. Remove letter. Contrast/size: inactive `--bone-faint`→`--bone-dim`, fontSize 10.5→12, letterSpacing 0.2em→0.16em.
- `src/loom/components/InfinityMenu.tsx` — ITEMS = search · inbox · on this day · export. Remove wrapped + book. Hints `--bone-faint`→`--bone-dim`; label 10→11.
- `src/pages/Weft.tsx` (+ read `src/loom/components/WeftCentury.tsx`) — **Inheritance Horizon** home: vertical time, ancestors below, "you are here" mid, faint unwoven future years above marked "not yet lived · for those not yet born"; member threads carry dye colour. **Card row:** Book `/book` · Wrapped `/wrapped` · Challenges `/challenges`. **Family entry** → `/family`. Paper ground, dye colour layer, Rule-2 clean.
- `src/pages/Compose.tsx` — consolidate (remove `?as=letter` letter-mode branch; keep text+photos). **Witness** ("for: those not yet born" + named descendants) at top. **Speak** primary option at top → `/record` (not below the fold). **Seal** commit = press-and-hold ("this cannot be unwritten"), Rule-2 compliant (square/dye/bone progress, no copper disc).
- `src/pages/Profile.tsx` — NEW. Profile + its own menu (settings, billing/account, theme, sign out). Shows the user's own thread/dye.
- aura-sweep (12 files): delete the `textShadow` aura line in Founder(×2) · BookSuccess · FounderWelcome · Join · GiftPurchase · GiftSuccess · FutureLetter · GoldLegacyRedeem · TiedOff · TimeCapsule · GiftRedeem · LetterOpeningCeremony.
- `src/pages/ResetPassword.tsx` + `src/pages/ForgotPassword.tsx` — delete aura line (ResetPassword:101); inputs Inter→`.hl-input`/Spectral.
- `src/pages/FirstThread.tsx` — remove copper ripple rings (294/295), radial ignition disc (214), inset copper box-shadow (274); re-token for theme-flip; scope waveform tokens to `.loom`. No copper discs reintroduced.
- `src/loom/cosmic/CosmicUI.tsx` — WarmDot: borderRadius 0 (square); copper default = 1px stroke (no fill); dye colours keep small filled square (sanctioned identity mark).
- `src/pages/AdminDashboard.tsx` + `src/pages/MarketingTab.tsx` — name 8 controls (id/htmlFor or aria-label); 2 admin ModalShells → real dialogs via `useFocusTrap`; AdminDashboard textareas Inter→Spectral.
- `src/pages/Pricing.tsx` + `src/pages/Signup.tsx` + `src/pages/BookBuilder.tsx` (or BookPage) — Pricing route through `PLAN_FEATURES` + restore 5-member cap (display only); Signup overclaim copy; BookBuilder hex→tokens.
- `src/pages/ThreadCompose.tsx` — data-URI caret token-driven so it theme-flips.

## Build / ship

After all agents land: `cd cloudflare/frontend && npm run build` must pass clean. Bump `public/sw.js` CACHE v152→v153. Commit + push main → Cloudflare auto-deploy. Re-bench to confirm craft/future climb.
