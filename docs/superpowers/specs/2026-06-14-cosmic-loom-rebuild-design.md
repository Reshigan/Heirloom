# Cosmic Loom — Full UI Rebuild (design spec)

**Date:** 2026-06-14
**Status:** Awaiting user review
**Scope:** Re-skin the entire Heirloom web app + PWA (87 pages) so every page interior reads as
floating *in* the Cosmic Loom — the glowing-filament web already rendered globally by
`CosmicLoom.tsx` — rather than as parchment cards sitting *over* it. Drop Figma (not connected);
drive the design from code. Generate brand/texture/motion assets with Higgsfield.

## Decisions (locked with user)

- **Approach A — Cosmic chrome layer.** A thin cosmic semantic-token + primitive-component layer
  on top of the existing Heirloom tokens, plus a `ClothShell` chrome upgrade. Not a token-only
  reskin (C), not 87 bespoke pages (B).
- **Coverage:** all 87 pages, one sweep (product + marketing + auth + admin + gift/legacy).
- **Execution:** built sequentially by the main session (no parallel migration agents).
- **Figma:** dropped — not connected. Design lives in code, iterated live in the browser.
- **Higgsfield:** generate everything — OG/social images, nebula/texture plates, hero loop video.

## Design principle

The existing palette (`ink #0e0e0c` ground, `bone #f4ecd8` text, `warm #b07a4a` wax accent, the
10 natural dyes) is **already** the palette `CosmicLoom` paints from. So this is **not a new color
world** — it is a new **substrate semantics**: page panels stop being opaque parchment cards and
become *luminous-edged ink panels that let the web breathe at their edges*. The five ART_DIRECTION
rules and the kill-on-sight anti-patterns (no glassmorphism / blur / gradient mesh / icons /
spinners / toasts / avatar circles) remain in force. **No `backdrop-filter` blur** — "floating in
the deep" is achieved with translucent-ink fill + a 1px luminous border + an outer warm glow, never
frosted glass.

## Sub-project 1 — Cosmic design system (gates everything else)

### 1a. Cosmic semantic tokens — `src/styles/cosmic.css` (imported after `globals.css`)

Maps existing primitives to cosmic semantics; defined for both vault (default) and paper
(`[data-theme="light"]`) so theme toggle stays honest.

| Token | Vault value | Meaning |
|---|---|---|
| `--cosmic-deep` | `var(--ink)` | the ground / page background |
| `--cosmic-panel` | `rgba(20,20,18,0.72)` | floating panel fill (translucent ink, no blur) |
| `--cosmic-panel-solid` | `rgba(20,20,18,0.94)` | for dense reading panels needing full legibility |
| `--cosmic-edge` | `rgba(244,236,216,0.10)` | resting luminous hairline border |
| `--cosmic-edge-warm` | `rgba(207,147,90,0.20)` | border on focus/active |
| `--cosmic-glow` | `0 0 40px rgba(207,147,90,0.10)` | outer focal glow |
| `--filament` | `var(--rule)` | divider hairline |
| `--wax` | `var(--warm)` | knot/accent dot |

Paper theme overrides: `--cosmic-panel: rgba(250,246,238,0.80)`, edges darken to parchment-rule.

### 1b. Primitive kit — `src/loom/cosmic/`

Each is small, single-purpose, prop-minimal, and reads tokens (no literal hex):

- **`CosmicPanel`** — the floating container. Translucent-ink fill, 1px `--cosmic-edge` border that
  transitions to `--cosmic-edge-warm` on hover/focus-within over `--dur-mid`, outer `--cosmic-glow`.
  Props: `as`, `interactive`, `padded`, `className`. The replacement for ad-hoc `bg-*` card divs.
- **`CosmicCard`** — list/entry variant of CosmicPanel that keeps the dye left-thread (3px dye
  left-border) and name-color signal. Props: `dye`, `to` (optional Link wrap), `interactive`.
- **`CosmicHeader`** — page header chrome: mono uppercase eyebrow, Source Serif 4 display title
  (opsz-scaled), optional one-line subhead. Replaces the bespoke per-page headers.
- **`CosmicRule`** — filament divider: 1px `--filament` line with an optional faint `--wax` node.
- **`CosmicButton`** — `primary` = warm hairline outline that fills `--warm-glow` on hover (keeps
  warm < 3% surface; never a solid warm fill); `ghost` = bone hairline; `text` = bone-dim link.
- **`CosmicField`** — input/textarea: transparent fill, bottom `--filament` border that warms on
  focus, mono label. For form-heavy pages (Compose, Settings, auth).

### 1c. `ClothShell` + chrome upgrade

- Topbar: floats as a `--ink-translucent` scrim with a `--filament` underline; the `∞` mark and
  theme toggle stay. No new nav bar/tab bar/dashboard grid (per CLAUDE.md).
- `Breadcrumbs`: mono micro, bone-faint, warm on current.
- `BottomNav`: cosmic — translucent ink, filament top edge, warm dot on active.
- The page content well sits centered in negative space (60–70% empty per rule 3); the backdrop
  veil (already in `ClothBackdrop`) stays as the legibility layer behind room content.

## Sub-project 2 — Higgsfield brand assets (async; fired right after spec approval)

All prompts read the Heirloom world: deep near-black ground, warm `#b07a4a`/`#cf935a` glowing
filaments, bone light, **outside-time** (no UI chrome, no 2026 signal, no lens flare/neon).

1. **OG / social hero** — 1200×630, the filament web converging toward a bright recent thread, room
   for the line *"Start your family's thousand-year thread."* Target: marketing OG + PWA share.
   Saved to `public/og/` + wired into meta tags.
2. **Nebula / texture plates** — 1–2 seamless deep-space filament plates, layered at very low
   opacity (~0.05) *under* `CosmicLoom` on the landing hero — augments the canvas, never replaces it.
3. **Hero loop video** — short (~4–6s) seamless loop of filaments weaving across the deep, for the
   landing hero. One render at standard res to stay within the 712-credit budget; muted, `playsinline`,
   `prefers-reduced-motion` → falls back to the static OG hero / canvas.

Budget guard: images + plates first (cheap), confirm credit cost of the video job before committing;
if tight, ship canvas + static plate and defer video. Generated files imported via `media_import_url`
→ downloaded into `public/`.

## Sub-project 3 — Page migration (all 87, sequential, internal waves)

Order chosen so the most-used surfaces land first and each wave ends green:

1. **Core product** — LoomIndex, Memories, MemoryRoom, Compose, ThreadCompose, Letters, LetterRoom,
   Family, FamilyFeed, ThreadsIndex, ThreadDetail, Settings, Inbox, ReadingRoom, Record.
2. **Secondary product** — Milestones, LifeEvents, Memorials, MemorialPublic, Constellation,
   MemoryMap, MemoryCards, CardView, Streaks, Challenges, OnThisDay, DailySentence, QandA, Echo,
   InterviewMode, LegacyPlan, PersonPage, StoryView, StoryArtifact, Showcase, TiedOff, Threshold.
3. **Marketing / public** — Marketing, MarketingTab, Pricing, Founder, FounderWelcome, FoundersWall,
   Contact, Privacy, Terms, HelpSupport, SocialCalendarTab.
4. **Auth** — Login, Signup, Join, Onboarding, QuickWizard, ForgotPassword, ResetPassword,
   FutureLetter, ComposeLetter, RecipientExperience.
5. **Gift / legacy / admin / misc** — Gift* (7), Inherit/InheritanceCard, GoldLegacyRedeem, Billing,
   BookBuilder/BookPage/BookSuccess, Referrals, InviteCard, Join, AdminDashboard, AdminLogin,
   NotFound, Offline, PwaHome, PhotoQuick, Milestones, ScenarioPages.

Each page: replace opaque card divs with `CosmicPanel`/`CosmicCard`, page header with `CosmicHeader`,
buttons/inputs with `CosmicButton`/`CosmicField`, dividers with `CosmicRule`. Preserve all data flow,
routes, dye signal, and copy. Delete no content; this is a skin pass.

## Verification (per ART_DIRECTION + project memory)

- `cd cloudflare/frontend && npm run build` (tsc --noEmit + vite) is **clean (0 errors)** after each
  wave — the launch gate.
- Smoke key routes in `npm run dev` in **both** vault and paper themes (theme bridge already global).
- CSP: no inline scripts/handlers (prod CSP has no `unsafe-inline`); cosmic primitives use external
  modules + CSS only.
- Bump `public/sw.js` `CACHE` version once at the end so the PWA actually updates.
- No reintroduced anti-patterns: grep for `backdrop-filter`, `blur(`, `rounded-full`, icon-lib
  imports, spinner classes, toast — must stay absent in new code.

## Out of scope (this pass)

- Backend / worker / API changes.
- New routes or features — skin only.
- Native mobile shells (`mobile/`).
- Marketing automation engine.

## Risks

- **87 pages sequentially is long.** Mitigated by the shared kit: most pages are a handful of
  `CosmicPanel`/`CosmicHeader` swaps once the kit is locked. Waves end green so progress is shippable.
- **Higgsfield video credits.** Mitigated by image-first, confirm-cost-before-video, canvas fallback.
- **Theme parity.** Every cosmic token defined for both themes; smoke both.
