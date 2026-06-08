# UX Audit — Heirloom vs ART_DIRECTION.md

**Verdict:** The cloth system is architecturally sound and the global backdrop is wired correctly, but roughly half the authenticated page surface ignores the cloth shell primitives entirely, the font stack shipped diverges from what ART_DIRECTION.md specifies, and a handful of motion and gradient violations persist across core screens.

---

## Cloth Integration Findings

### Using ClothShell / ClothBackdrop correctly

These pages plug into the cloth system as intended:

- `Today.tsx` — ClothShell + TapestryCanvas, correct breadcrumb, correct easing
- `Settings.tsx` — ClothShell + Breadcrumbs, correct token usage throughout
- `Billing.tsx` — ClothShell + Breadcrumbs
- `Family.tsx` — ClothShell + Breadcrumbs
- `Memories.tsx` — ClothShell + Breadcrumbs, dye-thread left-border on cards
- `LoomIndex.tsx` — ClothShell + InfinityMenu in topbarCenter
- `LetterRoom.tsx` — ClothShell
- `VoiceRoom.tsx` — ClothShell
- `Constellation.tsx` — ClothShell
- `Onboarding.tsx` — ClothShell (noTopbar for ceremony screens)
- `Weft.tsx` — ClothShell, all three view variants
- `Inbox.tsx` — ClothShell
- `PwaHome.tsx` — ClothShell
- `ReadingRoom.tsx` — uses ClothBackdrop directly (intentional, custom shell)

The global `LoomShellRoot` in `App.tsx` mounts `ClothBackdrop` once, so even pages that roll their own shell still receive the animated cloth substrate behind them. This is the correct architecture — it means the cloth never flickers on route change.

### Not using any cloth shell primitive (~54 pages)

Roughly 54 out of ~85 page files import no cloth system component. Many are public or admin surfaces where this is correct (Login, Signup, Pricing, AdminDashboard, Privacy, Terms). The concern is the authenticated product pages in this set:

- `Compose.tsx` — rolls its own `hl-screen` + `hl-topbar` shell. Intentional (full-screen composer), but it duplicates ClothShell's topbar pattern without referencing it. `HLogo` is included; no Breadcrumbs.
- `Record.tsx` — rolls its own `hl-topbar` + `TapestryEdge`. Same rationale as Compose (ceremony screen), but inconsistent chrome: no BOTTOM_NAV_CLEARANCE applied.
- `ReadingRoom.tsx` — mounts ClothBackdrop twice (lines 308, 335) — once in the selvedge-nav branch and once in the empty state. The double-mount is harmless because ClothBackdrop is stateless, but it signals the page predates the global backdrop guarantee and has not been cleaned up.
- `HelpSupport.tsx` — no cloth wrapper found. Verified as an authenticated route (`/help`). Should use ClothShell.
- `FutureLetter.tsx` — uses `Frame` directly (not ClothShell). Acceptable for a full-page reading surface; documented intent.

The ~40 remaining no-shell authenticated pages (Streaks, Challenges, InterviewMode, TimeCapsule, MemoryMap, Milestones, MemoryCards, OnThisDay, QandA, Referrals, BookBuilder, GiftAMemory, etc.) render into the global backdrop but with no consistent topbar or breadcrumb. Users navigating these routes see the cloth ground but lose the ClothShell chrome contract. This is the primary continuity break in the product.

---

## ART_DIRECTION Violations

### 1. Font stack mismatch — ART_DIRECTION says Newsreader, shipped code uses Source Serif 4

`ART_DIRECTION.md` specifies "Newsreader Display" as the heading and display typeface (rule 1, typographic spec table at lines 136–159). The live codebase uses Source Serif 4 everywhere — `globals.css:68`, `globals.css:97`, and all `hl-serif` / `hl-h*` utilities. Newsreader is not loaded anywhere in the project.

This is not a product defect — CLAUDE.md documents that Source Serif 4 was canonicalized as a deliberate design handoff decision. But ART_DIRECTION.md has not been updated to reflect this. Anyone using ART_DIRECTION.md as the spec will be confused about which font is canonical.

**Action:** Update `ART_DIRECTION.md` lines 28 and 136–159 to name Source Serif 4 and document the `opsz` pairing table for its variable axis.

### 2. Gradient anti-pattern — `--cloth-scrim` is a radial gradient (`globals.css:120`)

ART_DIRECTION rule: "Any radial gradient that's 'atmospheric'" is a kill-on-sight anti-pattern. The cloth legibility scrim is:

```
--cloth-scrim: radial-gradient(120% 90% at 50% 0%, rgba(14,14,12,0.30) 0%, rgba(14,14,12,0.55) 60%, rgba(14,14,12,0.74) 100%);
```

This fires on every screen behind every authenticated page. It is the exact shape ART_DIRECTION bans. The functional justification (legibility over the 3D cloth) is valid, but the form violates the spec. A flat translucent ink value would serve the same legibility function.

**File/line:** `globals.css:120` (dark), `globals.css:193` (light).

### 3. Gradient anti-pattern — `.loom-horizon` atmospheric elliptical glow (`globals.css:1254`)

The `loom-horizon` CSS class uses `radial-gradient(ellipse 80% 100% at 50% 100%, var(--loom-warm-glow), transparent 70%)` as a warm atmospheric glow. ART_DIRECTION describes The Horizon as "a flat horizontal warmth that breathes ±2% intensity" — not an elliptical radial. This is both an atmospheric radial gradient and a decorative motion with no informational content.

**File/line:** `globals.css:1253–1255`.

### 4. Gradient anti-pattern — `Marketing.tsx:150`

The hero section uses `linear-gradient(to bottom, transparent 0%, rgba(14,14,12,0.65) 50%, rgba(14,14,12,0.97) 100%)` as a legibility scrim over the cloth hero. Functional, but implemented as a tall gradient overlay. Minor given context.

**File/line:** `Marketing.tsx:150`.

### 5. Off-spec durations — `Echo.tsx:96`, `ReadingRoom.tsx:408`

ART_DIRECTION permits only 180, 360, 720, 1400ms. Two violations:

- `Echo.tsx:96`: `400ms` transition for Listener prompt-line stagger. This is the first animation users see after login — the most visible motion violation in the product.
- `ReadingRoom.tsx:408`: `220ms` opacity fade on the filter bar.

### 6. Off-spec easing — `Compose.tsx:1092`

Progress bar width uses `transition: 'width 180ms linear'`. The only permitted easing is `cubic-bezier(0.16,1,0.3,1)`. Linear easing for a progress fill is understandable UX (linear feels accurate) but still a spec violation. Document the exception or change to the canonical curve.

### 7. Concentric circle metaphor — `Record.tsx:282–334`

The recording UI renders three concentric `borderRadius: '50%'` rings that breathe during recording. ART_DIRECTION rule 5 ("outside time") and the anti-pattern list apply: breathing circles are a canonical 2024 voice-app pattern. The entire Record page renders a visually distinct metaphor world (rings, circular timer frame) disconnected from the cloth/type system. This is the single page most likely to fail ART_DIRECTION's first-impression "Recognition" test — users can place it immediately as "a voice recorder."

**File/lines:** `Record.tsx:282–334`.

### 8. Avatar circle risk — `FamilyFeed.tsx`

`FamilyFeed.tsx` types an `author_avatar` field (line 14). If it renders this as a circle, it violates the "no avatar circles" rule. `Family.tsx:17` and `PersonPage.tsx:12` also carry `avatarUrl` fields. The rendered output of FamilyFeed was not confirmed but the data shape signals risk.

### 9. Noise grain primitive — `globals.css:1276`

A `loom-grain` class uses an SVG `feTurbulence` filter for a noise texture. ART_DIRECTION bans "gradient meshes, animated noise." The grain is 4% opacity and static (not animated), but its existence as a shared style primitive invites misuse on new surfaces.

---

## Top 5 Highest-Impact Changes

**1. Wire the ~12 highest-traffic authenticated pages missing ClothShell**

Priority: HelpSupport, Streaks, Challenges, InterviewMode, TimeCapsule, MemoryMap, Milestones, MemoryCards, OnThisDay, QandA, Referrals. Each needs `ClothShell` wrapping with a `Breadcrumbs` topbarLeft. This is mechanical but addresses the largest continuity break: users on these routes lose the topbar + breadcrumb contract that the cloth system enforces everywhere else.

**2. Replace `--cloth-scrim` radial gradient with a flat translucent ink value**

`globals.css:120` and `globals.css:193`. This is the most architecturally significant violation because it fires on every screen. Replace with `rgba(14,14,12,0.62)` (dark) and tune opacity until legibility over the 3D cloth is maintained. The radial shape is doing work that flat opacity can do — verify before shipping.

**3. Rebuild Record.tsx around the cloth/type system**

The recording ceremony is the most visually disconnected page in the product. Replace concentric rings with: a single expanding 1px hairline border (using `border: '1px solid var(--bone-dim)'`), the timer in JetBrains Mono at `clamp(48px, 8vw, 72px)`, and the waveform as a TapestryEdge or hairline progress bar. Wrap in ClothShell. This brings the most-used composition surface into the cloth language.

**4. Reconcile ART_DIRECTION.md font spec with the live codebase**

Update `ART_DIRECTION.md` lines 28 and 136–159 to name Source Serif 4 instead of Newsreader. Add optical-size pairings for the `opsz` variable axis as currently implemented in `globals.css:140–148`. Without this update, the spec document actively misdirects anyone working on type.

**5. Fix `Echo.tsx:96` — change 400ms to 360ms**

One-line fix on the highest-traffic animated surface (the Listener / home screen). Restores motion vocabulary at the product's most important first-impression moment.

---

## What's Healthy — Protect This

**The global backdrop architecture.** `ClothBackdrop` mounted once in `LoomShellRoot` (`App.tsx:223`) over a single persistent WebGL context is correct. It prevents cloth flickering between routes and avoids multiple Three.js instances. Do not move ClothBackdrop into individual pages.

**The BottomNav gate logic.** `BottomNav.tsx:28–41` cleanly hides the nav on public routes, auth screens, admin, and marketing. The `HIDE_PREFIXES` set is exhaustive and the implementation is readable. Protect this against drift as new public routes are added.

**The dye system implementation in Memories.tsx and ReadingRoom.tsx.** The `borderLeft: '3px solid ${dyeColor}'` left-border thread + `dyeVar` / `dyeForId` / `dyeFromMetadata` logic is exactly right: dyes as signal at the thread edge only, never as fills or backgrounds. This is the clearest implementation of the design constitution's dye rule. Enforce this as the template for all new list/card surfaces.

**Inline status feedback — no toasts anywhere.** Confirmed zero toast library imports across the entire `cloudflare/frontend/src` tree. Status is inline everywhere: `savedFlash` in Settings, `∞ saved` / `∞ updated` spans, `'saving…'` / `'sealing…'` button text. This is one of the hardest anti-patterns to hold against product pressure. It is clean.

**The ∞ mark as the only icon.** Confirmed zero icon library imports (lucide-react, heroicons, phosphor, react-icons, feather) across the frontend. ∞ appears in BottomNav center, ClothPage back button, WeaveCeremony, and confirmation states. This is well-held across a codebase of this size.

**ClothPage fold transition.** `ClothPage.tsx` implements perspective rotateX in exactly 360ms on `cubic-bezier(0.16,1,0.3,1)` with `transformOrigin: 'center top'`. The implementation matches the motion spec exactly and is the product's most distinctive interaction primitive.

**Motion token compliance in Compose.tsx and Settings.tsx.** Both pages use only 180ms, 360ms, 720ms, and the canonical curve for all transitions (one `linear` exception on the upload progress bar, flagged above). The motion feels authored on these pages.
