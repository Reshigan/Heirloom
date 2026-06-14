# Cosmic Loom Full-UI Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.
> Verification gate is `npm run build` (tsc --noEmit + vite build) green + browser smoke in BOTH
> themes — there is no component unit suite for this visual layer; do not invent fake unit tests.

**Goal:** Re-skin all 87 pages of the Heirloom web app so each interior floats *in* the Cosmic Loom
filament web, via a shared cosmic token + primitive layer, plus Higgsfield brand/texture/video assets.

**Architecture:** Thin cosmic semantic-token CSS (`cosmic.css`) maps existing ink/bone/warm/dye
primitives to cosmic semantics; a small primitive kit (`src/loom/cosmic/`) gives every page the same
floating-panel chrome; `ClothShell`/Breadcrumbs/BottomNav upgraded once propagate widely. Pages
migrate wave by wave, each wave ending with a green build.

**Tech Stack:** React 18 + Vite + TS + Tailwind; canvas `CosmicLoom`; CSS custom properties; Higgsfield MCP.

**Working dir:** `cloudflare/frontend`. Build gate: `cd cloudflare/frontend && npm run build`.

---

## Task 1: Cosmic semantic tokens

**Files:** Create `src/styles/cosmic.css`; Modify `src/styles/globals.css` (add `@import` / append block).

- [ ] Add cosmic token block (both themes) per spec table: `--cosmic-deep`, `--cosmic-panel`,
  `--cosmic-panel-solid`, `--cosmic-edge`, `--cosmic-edge-warm`, `--cosmic-glow`, `--filament`, `--wax`.
- [ ] Paper-theme overrides under `.loom[data-theme="light"]`.
- [ ] `npm run build` → clean.
- [ ] Commit.

## Task 2: Primitive kit `src/loom/cosmic/`

**Files:** Create `CosmicPanel.tsx`, `CosmicCard.tsx`, `CosmicHeader.tsx`, `CosmicRule.tsx`,
`CosmicButton.tsx`, `CosmicField.tsx`, `index.ts` (barrel).

- [ ] `CosmicPanel` — translucent-ink fill, 1px `--cosmic-edge` → `--cosmic-edge-warm` on
  hover/focus-within (`--dur-mid`), outer `--cosmic-glow`, no `backdrop-filter`. Props `as`,
  `interactive`, `padded`, `className`, `style`.
- [ ] `CosmicCard` — CosmicPanel + 3px dye left-thread (`dye` prop → `--dye-*`), optional `to` Link wrap.
- [ ] `CosmicHeader` — mono uppercase eyebrow, serif display title, optional subhead. Props `eyebrow`,
  `title`, `sub`.
- [ ] `CosmicRule` — 1px `--filament` divider, optional `--wax` node (`node` prop).
- [ ] `CosmicButton` — `variant` primary|ghost|text; primary = warm hairline filling `--warm-glow`
  on hover, never solid warm fill.
- [ ] `CosmicField` — label(mono) + input/textarea, transparent fill, bottom `--filament` border
  warming on focus. Props mirror native input + `label`, `multiline`.
- [ ] Barrel export all from `index.ts`.
- [ ] `npm run build` → clean. Commit.

## Task 3: ClothShell + chrome upgrade

**Files:** Modify `src/loom/components/ClothShell.tsx`, `Breadcrumbs.tsx`, `BottomNav.tsx`.

- [ ] Topbar: `--ink-translucent` scrim + `--filament` underline; keep `∞`, theme toggle.
- [ ] Breadcrumbs: mono micro, bone-faint, warm current.
- [ ] BottomNav: translucent ink, filament top edge, warm active dot. No new nav patterns.
- [ ] `npm run build` → clean. Smoke `/loom` both themes. Commit.

## Task 4: Higgsfield assets (async — start after Task 1)

**Files:** Create `public/og/cosmic-hero.*`, `public/textures/nebula-*.png`,
`public/video/cosmic-loom-hero.mp4`; Modify `index.html` (OG meta), landing hero component.

- [ ] `generate_image` OG hero 1200×630 (deep ground, warm glowing filaments, room for headline).
- [ ] `generate_image` 1–2 seamless nebula/texture plates.
- [ ] Check `balance`; if video affordable, `generate_video` ~5s loop; else defer, note in plan.
- [ ] `media_import_url` → download into `public/`. Wire OG meta + hero `<video>`/`<img>` fallback.
- [ ] `npm run build` → clean. Commit.

## Task 5–9: Page migration waves (each wave: migrate → build green → smoke both themes → commit)

Per page: opaque card div → `CosmicPanel`/`CosmicCard`; page header → `CosmicHeader`;
buttons/inputs → `CosmicButton`/`CosmicField`; dividers → `CosmicRule`. Preserve data flow, routes,
dye signal, copy. Skin only.

- [ ] **Wave 1 — Core:** LoomIndex, Memories, MemoryRoom, Compose, ThreadCompose, Letters, LetterRoom,
  Family, FamilyFeed, ThreadsIndex, ThreadDetail, Settings, Inbox, ReadingRoom, Record. Build + commit.
- [ ] **Wave 2 — Secondary:** Milestones, LifeEvents, Memorials, MemorialPublic, Constellation,
  MemoryMap, MemoryCards, CardView, Streaks, Challenges, OnThisDay, DailySentence, QandA, Echo,
  InterviewMode, LegacyPlan, PersonPage, StoryView, StoryArtifact, Showcase, TiedOff, Threshold. Build + commit.
- [ ] **Wave 3 — Marketing:** Marketing, MarketingTab, Pricing, Founder, FounderWelcome, FoundersWall,
  Contact, Privacy, Terms, HelpSupport, SocialCalendarTab. Build + commit.
- [ ] **Wave 4 — Auth:** Login, Signup, Join, Onboarding, QuickWizard, ForgotPassword, ResetPassword,
  FutureLetter, ComposeLetter, RecipientExperience. Build + commit.
- [ ] **Wave 5 — Gift/legacy/admin/misc:** GiftAMemory, GiftPurchase, GiftReceive, GiftRedeem,
  GiftSubscriptions, GiftSuccess, Inherit, InheritanceCard, GoldLegacyRedeem, Billing, BookBuilder,
  BookPage, BookSuccess, Referrals, InviteCard, AdminDashboard, AdminLogin, NotFound, Offline,
  PwaHome, PhotoQuick, ScenarioPages. Build + commit.

## Task 10: Final verification

- [ ] Anti-pattern grep on new code: `backdrop-filter`, `blur(`, `rounded-full`, spinner/toast, icon-lib — absent.
- [ ] `npm run build` clean. Smoke a route from each wave, both themes.
- [ ] Bump `public/sw.js` `CACHE` version once.
- [ ] Final commit.

## Self-review notes
- Spec coverage: tokens(T1), kit(T2), chrome(T3), Higgsfield all-3(T4), 87 pages(T5-9), verify+SW bump(T10). Covered.
- No fake unit tests: gate is build+smoke, stated up top.
- Type consistency: prop names fixed here (CosmicPanel `interactive/padded`, CosmicCard `dye/to`,
  CosmicHeader `eyebrow/title/sub`, CosmicButton `variant`, CosmicField `label/multiline`, CosmicRule `node`).
