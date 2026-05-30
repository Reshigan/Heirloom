# Heirloom — UX / Design Audit (LIVE deployed tree)

**Scope.** `cloudflare/frontend/src` — the tree deployed by `.github/workflows/deploy-cloudflare.yml`.
This supersedes the earlier `UX_AUDIT.md` that mistakenly audited the dead `/frontend` redesign.
Audited against `STITCH_BRIEF.md` §1.5 (world-first invariants), §2 (visual constitution),
§2.6 (anti-patterns), §2.7 (dye palette), §6.0 (persistent elements), §11 (definition of done).

**One-line verdict.** The `/loom/*` demo subsystem is a faithful, restrained sketch of the brief's
voice — but it is a *nine-screen marketing walk-through wired to `/loom/*`*, not the product. The
actual deployed authenticated app (`/`, `/dashboard`, `/threads/*`, `/compose`, and ~40 feature
pages) is the pre-brief v1/v2/v3 SaaS app, re-skinned by a CSS bridge. **None of the five world-first
invariants ship on a single real product screen.** Closeness to brief: **marketing ~70%, product
~25%.**

---

## Architecture reality (read first)

- `src/App.tsx:184` mounts `/` → `LoomMarketing` (a scrolling sales page). There is **no
  full-surface Tapestry home** anywhere. Brief §6.2 / §1.5-A require `/` (authenticated) to be the
  full-canvas woven cloth; it does not exist.
- The authenticated "home" is `/dashboard` (`src/App.tsx:234`, `pages/Dashboard.tsx`) — a card-grid
  dashboard with a stats footer. Brief §2.6 explicitly forbids "a home dashboard with cards, tiles,
  recent-activity feeds, or stats blocks."
- `src/components/Navigation.tsx` is a **persistent sticky global top nav bar** with 6 primary tabs +
  a 24-item "More" dropdown + an avatar circle. Brief §6.0.4 / §11.11: "No global nav bar, no tab
  bar, no rail." This is the single largest structural violation and it is on every authed screen.
- The Loom's named primitives that the brief makes load-bearing — **the Tapestry edge, the
  append-only entry counter, the Listener** — do not exist as components anywhere in `src` (grep
  for `TapestryEdge`, `thread no.`, a real `Listener`: zero hits). The "Loom/Weft" band exists only
  inside the `/loom/*` demo pages and is never rendered on a product screen.
- The 10-stop natural-dye palette (§2.7) is **never implemented.** `loom/components/Loom.tsx:52`
  `colorFor()` colors every weft thread in bone-tints + one warm; madder/indigo/weld/etc. appear
  nowhere in the codebase.
- Dead code confirmed not mounted (good): `AIAssistant.tsx`, `SupportBot.tsx` (chatbot panels),
  `EternalBackground`, `CSSParticles` — all unreferenced by `App.tsx`. Leave deleted/unmounted.

---

## P0 — Launch-blocking constitution violations

### P0-1 · Global nav bar / tab bar on every authenticated screen
`components/Navigation.tsx:71-360` (and `loom/components/Frame.tsx:55-75` topbar; `AppFrame.tsx:27-28`
renders `<Navigation/>`).
- Violation: §6.0.4, §11.11 forbid a global nav bar/tab bar/rail. This is a sticky 60px header with
  PRIMARY tabs (`Navigation.tsx:20-27`), a 24-entry MORE menu (`:29-54`), and a mobile burger menu.
- Fix: Delete the nav bar. Navigation per brief is via the **eyebrow-row text links** + the
  **Tapestry edge** (clicking it zooms to `/`). Replace `Navigation` with an `Eyebrow` component
  (screen name · `thread no. NNNN · entry N,NNN` · single context link e.g. `compose →`) and a
  bottom `TapestryEdge` band. Every page wrapped by `AppFrame` inherits both.

### P0-2 · No Tapestry, no Tapestry edge, no append-only counter on any product screen
`App.tsx:184,234` (no full-surface Tapestry route); whole `pages/*` tree.
- Violation: Invariants A & B; §6.0.1, §6.0.3; §11.11-12. The home is not the cloth; no screen
  carries the 4/8px edge band with the warm position-hairline; no screen shows the growing
  `thread no. 0001 · entry 1,247` counter.
- Fix: (a) Build a real `Tapestry` full-surface component and mount it at the authenticated `/`
  (move marketing to `/welcome` or gate `/` by auth). (b) Extract the existing `loom/components/Loom.tsx`
  band into a reusable `TapestryEdge` (4px mobile / 8px desktop, warm position-hairline) and render
  it in `AppFrame`. (c) Add the entry counter to the eyebrow on every authed screen.

### P0-3 · The Unlock is a literal fire/wax-seal ceremony with glow + blur + shadows
`loom/pages/Unlock.tsx:130-256` ("THE CORD" that *burns*, "THE WAX SEAL" that melts into a wax
pool, sparks at `:166-184`, `loom-spark-*` keyframes `:408-419`).
- Violation: §2.6 — "a fire, a hearth, a candle, a flame, a glow source … a vault door, a safe, a
  key, a lock-and-key … any literal metaphor object" is forbidden; "The Tapestry is the only
  object." Also §1.5-D / §2.5: the Unlock must be a **720ms typographic cross-fade** (∞ fades, date
  fades, title appears in warm), nothing else. The screen also uses `boxShadow`, `filter: blur`,
  radial gradients (`:159,:207-212,:280-281`).
- Fix: Replace the entire cord/wax/spark sequence with the 720ms dissolve: a `SealedNote` whose `∞`
  + date fade out as the entry title fades in (`warm`), with the suspended thread lowering into the
  edge band. Remove all glow, blur, and box-shadow.

### P0-4 · Icon library (lucide-react) across the canonical Thread surfaces
15 files import `lucide-react`. The product is supposed to have **no icons** (§2.6, §11.3; `∞` is
the only mark). Worst offenders are the canonical Thread screens the brief centers on:
- `pages/Threads.tsx:5` (`Plus, ArrowRight, Loader2, Users, BookOpen`), `:88,91,95,106,148`.
- `pages/ThreadDetail.tsx:5` (`ArrowLeft, BookOpen, Lock, Users, Loader2, Plus, ArrowRight, UserPlus, X, Crown`).
- `pages/ThreadCompose.tsx`, `pages/Founder.tsx`, `pages/FounderWelcome.tsx`, `pages/LegacyPlan.tsx`,
  `pages/LifeEvents.tsx`, `pages/StoryArtifact.tsx`, `pages/StoryView.tsx`, `pages/MemoryRoom.tsx`,
  `pages/RecipientExperience.tsx`, `pages/Contact.tsx`, `components/WhatsNewNotification.tsx`,
  `components/FeatureOnboarding.tsx`, `ui/SuccessState.tsx`.
- Fix: Remove every lucide import; replace with type/mono labels (e.g. `entries`, `members`,
  `open →`). The only glyph permitted is `∞`.

### P0-5 · Loading spinners (`animate-spin` / `Loader2`) instead of a hairline progress bar
`Threads.tsx:66,148`; `ThreadDetail.tsx:97,276`; `Inherit.tsx:291-298` ("Unlocking memories…"); 67
`animate-spin` hits tree-wide.
- Violation: §2.6, §8.1 — "No spinners. Ever." Use a 1px bone-on-ink hairline progress bar,
  left-to-right 1400ms.
- Fix: Build one `ProgressHair` component (brief §10) and replace every spinner with it.

### P0-6 · Glassmorphism (backdrop-filter blur) on the nav/header chrome
`components/Navigation.tsx:84-85` (`backdropFilter: 'blur(10px)'`); `loom/pages/Marketing.tsx:84-85`;
18 `backdrop-filter` + 24 `blur(` hits tree-wide.
- Violation: §2.6 — glassmorphism / frosted glass / blurred backgrounds forbidden.
- Fix: Solid `var(--loom-ink)` surfaces with a 1px `rule` hairline; remove all `backdrop-filter`
  and decorative `blur()`. (The bridge already flattens `.glass*` at `loom-bridge.css:195-204` —
  extend the same treatment to the inline-styled headers.)

### P0-7 · Avatar circle identity chip in the nav
`components/Navigation.tsx:218-236` (`width:32,height:32,borderRadius:'50%'` user-initials button);
239 `borderRadius:'50%'` / `rounded-full` hits tree-wide.
- Violation: §2.6 — "Avatar circles, gravatar-style identity chips" forbidden; §2.4 radius 0px
  default (never >4px).
- Fix: Replace with a mono text link (`user.firstName` / `settings →`). Audit and remove all
  `rounded-full` / `border-radius:50%` and the 418 `rounded-xl/2xl/3xl` / `99px` pill hits; cap
  radius at 2px (inputs) / 4px max.

### P0-8 · Decorative emoji in live surfaces
`pages/Wrapped.tsx`, `pages/Streaks.tsx`, `components/NotificationSystem.tsx`,
`components/LegacyScore.tsx`, `components/OnboardingWizard.tsx` (+ AIAssistant/SupportBot, dead).
- Violation: §2.6, §11.3 — no decorative emoji. Wrapped and Streaks are reachable product routes.
- Fix: Strip emoji; use `∞` or mono labels only.

### P0-9 · Toast notification system
`components/NotificationSystem.tsx` (the only toast implementation; emoji + transient popups).
- Violation: §2.6, §7.2, §8 — "No toast notifications. … inline status only."
- Fix: If mounted, remove; route all feedback to inline mono status lines (saved · 14:22; offline ·
  changes will sync; couldn't reach the archive · try again).

### P0-10 · The home is a card/stats dashboard
`pages/Dashboard.tsx:120-222` ("Today's three" card grid `:125-204`; "Quiet stats footer"
`:207-222`).
- Violation: §2.6 — home dashboard with cards/tiles/stats blocks forbidden; §1.5-A — the home is
  the cloth, full surface, nothing else.
- Fix: Replace `/dashboard` with the full-surface Tapestry (P0-2). The "three actions" and stats
  belong nowhere; the selvedge prompt (`the next thread is yours. compose →`) is the only CTA.

---

## P1 — Important (brief fidelity, not strictly blocking the calm)

### P1-1 · The "horizon" warm glow — atmospheric radial/linear gradient that breathes
`loom/styles/loom.css:155-169` (`radial-gradient` + `linear-gradient` warm wash over bottom 36%,
`loom-breathe` infinite). Rendered on every Loom screen via `Frame.tsx:79` and `AppFrame.tsx:30`.
- Violation: §2.6 — "Any radial gradient billed as 'atmospheric'"; "Any motion that doesn't carry
  information"; the warm accent must stay <3% surface (§2.1.3) — a 36%-tall wash blows that budget.
- Fix: Remove the horizon entirely. Warm is reserved for the single position-hairline + rare CTAs.

### P1-2 · framer-motion entrance animations (translateY / opacity) — motion without meaning
`Threads.tsx:48-62`, `ThreadDetail.tsx:136-184`, `Inherit.tsx:291,311`, `loom/pages/Threshold.tsx:42`
(`translateY(8px)→0`).
- Violation: §2.6 — "'Floating' cards with translateY hover"; §2.1.5 / §11.5 — motion is the slow
  pan, the ±2% selvedge sway, and meaningful 180/360/720/1400ms transitions only.
- Fix: Replace with the §6.1 scroll behavior (360ms bone-dim→bone opacity fade, **no translateY**).

### P1-3 · Box-shadows / drop shadows (the brief allows none)
`Navigation.tsx:157,248`; `loom.css:211,234` (pick/dot glows); `loom/pages/Unlock.tsx` (many);
`loom/pages/Constellation.tsx:135`; `loom/pages/ReadingRoom.tsx:307-309` (blur 20px glow).
- Violation: §2.4 — "no shadows." Hairlines only.
- Fix: Remove all `box-shadow` / `filter: blur`; separate surfaces with 1px `rule` hairlines.

### P1-4 · Pill-shaped controls (border-radius 99px)
`loom.css:402-489` (`.loom-demo summary`, `.loom-theme-pill` at `:467,:482`).
- Violation: §2.4 — radius never >4px.
- Fix: Square the theme toggle and demo pill to 0–2px. (The vault/paper toggle's existence is also
  off-brief — a dark-only product + light marketing surface, §"Surface scope"; the per-page toggle
  in `theme.ts` is a v3 artifact.)

### P1-5 · The Listener (Invariant C) is unimplemented
No `Listener` margin slot on any screen (§6.0.2, §11.13). The Composer's "whisper"
(`loom/pages/Composer.tsx:101-128`) is the closest thing but it is hard-coded demo text inline in
the prose column, not the right-margin ambient mono line, and it speaks while/just-after typing
(violates §7.3 "stays silent while typing; after 8s pause").
- Fix: Build the `Listener` component (right-margin, 60ch offset, single mono line, 720ms
  bone-faint→bone-dim, dismiss on tap/Esc, once per screen, never warm, silent on Composer-while-
  typing / admin / first 12s of `/`). Reserve the slot in `AppFrame`.

### P1-6 · The dye palette (Invariant E / §2.7) is absent
`loom/components/Loom.tsx:52-60` colors threads by bone-opacity + one warm; the 10 historic dyes are
never used. The cloth therefore can't encode emotion (joy/grief/birth/...), and the Composer has no
dye selector (§6.3).
- Fix: Implement the 10-stop palette as the *only* place these colors appear; add the publish-time
  dye selector to the Composer.

### P1-7 · Inherit (descendants' reader) is off-brief
`pages/Inherit.tsx:3` framer-motion; `:291-298` "Unlocking memories…" spinner; `:311-316`
`rounded-full bg-red-500/20` error circle; Tailwind red.
- Violation: §6.14 (cover → 720ms Unlock dissolve, Wall typography); §8.3 (no red; warm underline).
- Fix: Rebuild on the Unlock dissolve + Wall reader; remove red, spinner, motion, rounded circle.

### P1-8 · Composer (deployed) lacks the unwoven thread, dye, visibility/lock rails
`pages/Compose.tsx` (wrapped in `AppFrame`, so it also gets the nav bar). No selvedge thread, no
1400ms weave-on-publish (§1.5-A, §6.3), no visibility/lock/dye/recipient rail, no Tapestry edge.
- Fix: Bring the `loom/pages/Composer.tsx` structure into the real `/compose`, add the bottom rail
  (visibility · lock · recipient · dye · save status) and the unwoven thread at the edge band.

### P1-9 · Bridge re-skin leaves v1/v2 Tailwind markup (rounded-md inputs, void/paper/gold classes)
`loom/styles/loom-bridge.css` heroically re-themes color/type but cannot fix shape/structure: inputs
across `ThreadDetail.tsx`, `Threads.tsx` etc. keep `rounded-md`/`rounded-xl`, `px-4 py-3`, card
chrome. The bridge is a stopgap, not the migration.
- Fix: Port the high-traffic pages (Threads, ThreadDetail, Settings, Family, Letters, Inbox,
  Billing) to native Loom markup + `AppFrame`-without-nav, then retire the bridge.

---

## P2 — Polish

- **P2-1 · `loom-grain` SVG-noise overlay** `loom.css:171-178` (`mix-blend-mode:screen`, animated
  fractal-noise source) flirts with §2.6 "animated noise." It is static (opacity 0.04) so low-risk,
  but textile fidelity (§1.5-E) wants real warp threads, not turbulence grain. Prefer the warp.
- **P2-2 · Marketing hero** `Marketing.tsx:159` `clamp(56px,9vw,144px)` is Newsreader (passes), but
  watch the §2.6 "Inter Display tracked tight at 80px" smell — keep heroes serif and ≥−0.024em only.
- **P2-3 · Focus states.** Inputs set `outline:none` and only change border color
  (`loom-bridge.css:226-231`). §7.6 requires a visible 1px warm focus ring at 2px offset on **every**
  interactive surface (links, buttons, nav). Add a global `:focus-visible` ring.
- **P2-4 · Reduced-motion** is handled well in CSS (`loom.css:492-497`, `loom-bridge.css:288-293`),
  but JS `setTimeout` loops (`Unlock.tsx:31-48`, `Echo.tsx:19-30`, `Composer.tsx:29-44`) ignore
  `prefers-reduced-motion` and keep cycling. Gate these on the media query.
- **P2-5 · Hard-coded mono dates** `Frame.tsx:71` (`2026·05·05 · 22:14`) and in Composer/Unlock —
  fine for a demo, must be real before these patterns ship to product.
- **P2-6 · Vault/paper theme toggle** (`Navigation.tsx:207-214`, `ThemeToggle`, `theme.ts`) — the
  product is dark-only (brief "Surface scope"). The toggle is a v3 leftover; remove from product
  chrome (keep at most a marketing curiosity).
- **P2-7 · "Today's three" minHeight 220 buttons** read as cards even when borderless
  (`Dashboard.tsx:170`); resolved once the home becomes the Tapestry, but flag for any interim.

---

## What's healthy — protect this

The `/loom/*` subsystem demonstrates the brief's *voice* better than anything in the repo. Keep and
build on:

- **Token system** `loom/styles/loom.css:11-47` — exact brief colors (ink `#0e0e0c`, bone `#f4ecd8`
  + opacity ramp, warm `#b07a4a`/bright/dim, rule at 0.08), the single easing
  `cubic-bezier(0.16,1,0.3,1)`, and the precise duration vocabulary (180/360/720/1400 +
  9000 breath). This is the constitution, correctly codified — reuse everywhere.
- **Type system** — Newsreader / Inter / JetBrains Mono only, optical sizes wired
  (`loom-display` opsz 72, `loom-h2` opsz 56, `loom-body` opsz 14, mono labels). No 4th typeface.
- **`SealedNote`** `loom/components/SealedNote.tsx` — the `∞` + mono date + italic recipient stack
  is exactly the §2.5 primitive. Canonical; make it the basis of the real Unlock and Inbox.
- **`∞` discipline** — across the Loom pages the only mark is `∞` (`loom.css:132`, Marketing
  Megafact `:413`, SealedNote). No icon library inside `/loom/*`. Hold this line for the product.
- **Editorial restraint** — Marketing/Echo/Weft copy and spacing hit the 60–70% negative-space,
  print-fidelity feel (`Echo.tsx` two-letter resonance, `Weft.tsx` typographic stat rows). The
  *aesthetic target* is proven; it just hasn't reached the product pages.
- **Reduced-motion CSS kill-switch** (`loom.css:492`, `loom-bridge.css:288`) — correct global
  approach; just extend it to the JS timers (P2-4).
- **Dead anti-pattern code is unmounted** — `AIAssistant`, `SupportBot`, `EternalBackground`,
  `CSSParticles` are not referenced by `App.tsx`. Keep them out; delete when convenient.

---

## Top findings (summary)

1. `/` is the marketing page; there is **no Tapestry home** and no full-surface cloth anywhere (Inv A).
2. A **global sticky nav bar + avatar circle** (`Navigation.tsx`) rides every authed screen — the #1 structural violation of §6.0.4.
3. **No Tapestry edge, no append-only entry counter, no Listener** exist as real components on any product screen (Inv A/B/C unshipped).
4. The **Unlock is a literal burning-cord/melting-wax-seal** animation (`Unlock.tsx`) — a §2.6 fire/seal metaphor; brief wants a 720ms typographic dissolve (Inv D).
5. **lucide-react icons** in 15 files incl. the canonical `Threads`/`ThreadDetail` — product must have no icons but `∞`.
6. **Spinners** (`Loader2`/`animate-spin`, 67 hits) instead of the required hairline progress bar.
7. **Glassmorphism** (`backdrop-filter: blur`) on nav + marketing headers (§2.6).
8. The authenticated **home is a card/stats dashboard** (`Dashboard.tsx`) — explicitly forbidden.
9. The **10-stop natural-dye palette is unimplemented**; threads are bone-tinted (Inv E / §2.7).
10. **Atmospheric warm "horizon" glow** breathing under every Loom screen blows the <3% warm budget.
11. Healthy core: the **loom.css token + type system, `∞` discipline, and `SealedNote`** are brief-accurate — build the product on them, retire the v1/v2 bridge.
12. **Verdict:** the marketing/demo is ~70% to brief and worth protecting; the *product* is ~25% — a re-skinned legacy SaaS app. Launch readiness against the constitution is **far**: the five invariants must be built into real product screens, not just the `/loom/*` walk-through.
