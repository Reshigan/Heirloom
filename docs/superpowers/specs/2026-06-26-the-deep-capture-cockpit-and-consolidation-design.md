# The Deep — Capture Cockpit + Surface Consolidation Design

**Date:** 2026-06-26
**Status:** Approved (design); ready for plan
**Brand:** "The Deep" — ground `#070d14`, cream `#f2e6d0`, copper `#e0a062` (<3% surface), Fraunces (display ≥24px) / Source Serif 4 (body) / JetBrains Mono (labels). ∞ is the only mark. No icon library, no spinners (ProgressHair), no toasts.

---

## Why

A live Playwright audit + a three-perspective principal-design review (brand coherence, end-to-end journeys, IA/visual system) found the app is **structurally sound but smothered**:

- **7 capture routes** (`/compose`, `/record`, `/photo`, `/quick`, `/interview`, `/daily`, `/future-letter`) — the same act with 5 different commit ceremonies.
- **5 scrolling ledgers** (`/memories`, `/loom/index`, `/threads`, `/family-feed`, `/on-this-day`) — the same `memories+letters+voice` data re-rendered, decade-grouping logic copy-pasted 3×.
- **4 competing navs** (BottomNav, two parallel topbars `ClothShell`+`Frame`, the ∞ drawer) — "home" resolves to 4 different routes.
- **Brand drift**: the home backdrop is already `<WaterCanvas/>` (water), but user-facing copy still says "weave it in" / "cloth" while the install manifest already says "Lower in a voice." Two metaphors fighting in one bundle.
- **Contrast complaint** traced to faint cream body (`--bone-faint` below AA) + sub-44px tap targets, **not** the copper.

This design consolidates capture → one cockpit, the 5 ledgers → one paged reader, nav 5→4, and reconciles the vocabulary to water — without renaming a single route or component (users never read `/loom/weft`; renaming is a migration for zero payoff).

## Goals

1. One capture surface (`/capture`) — voice-first, photo or text, Memory by default.
2. One read surface — a paged (no-scroll) reader built from the existing `ReadingRoom`, landing on a decade plane that drills into an entry plane.
3. Bottom nav of 4 destinations; ∞ as the single utility drawer; delete the orphan `Frame` topbar.
4. Vocabulary reconcile: verb `weave it in → let it settle`, nav label `cloth → the deep`, rewrite the two design docs.
5. Contrast/tap-target accessibility lift on the reader's controls.

## Non-goals

- **No route renames.** `/loom/*` paths and all component names (`ClothBackdrop`, `WeftCentury`, etc.) stay. Internal `loom`/`weft` vocabulary stays.
- **No backend store merge.** The three stores (`memoriesApi`, `lettersApi`, `threadsApi`) stay as-is; this is a read/write *routing* change, not a schema migration.
- **No new mark.** Keep ∞. Do not build the unbuilt "Sounding" mark.
- Pricing, ZAR localization, billing fields untouched.
- Deleting the old capture/ledger page files is deferred — they become unrouted but remain on disk for one release (revival safety), matching the established echo/streaks pattern.

---

## Architecture overview

```
                     BottomNav (4)
   ┌──────────┬───────────────┬──────────┬────────┐
   │ The Deep │  ▣ Capture    │  Family  │  You   │
   │ /loom/   │  (center,     │ /family  │/loom/  │
   │  weft    │   warm field) │          │ profile│
   └────┬─────┴──────┬────────┴──────────┴────────┘
        │            │
        │            └─→ /capture  (cockpit: voice | photo | write)
        │                  default sink → memoriesApi.create  (Memory)
        │                  recipient set → lettersApi          (Letter)
        │
        └─→ read surface
              DecadePlane  (one decade / screen)  ──tap entry──▶  EntryPlane
              └── both rendered by <PagedReader>   (promoted from ReadingRoom)

   ∞ drawer (single utility menu): search · inbox · on-this-day · export
```

---

## Component A — `/capture` cockpit

**File:** `cloudflare/frontend/src/pages/Capture.tsx` (new). Route added in `src/App.tsx` (lazy, protected).

**Purpose:** Replace the 7 capture entry points with one voice-first surface. It is the center BottomNav action and the surface onboarding's first-entry routes through.

**Three modes, one screen** (mode is local state, no route change):

1. **Voice (default).** A large record affordance (warm copper hairline ring, NOT the ∞, NOT the logo). Uses the existing `MediaRecorder` + `recorder.onstop → aiApi.transcribe({audioUrl})` pipeline already in `Record.tsx:159-224`. On transcribe: show the transcript as editable Source Serif body text. User then chooses one of:
   - **Keep as voice** — saves via `voiceApi.create` (which already mirrors into the default thread via `mirrorIntoDefaultThread`, so it stays visible on the Deep).
   - **Attach a photo** — reuses Compose's image path (`addImages`, `Compose.tsx:1061-1096`); saved as a Memory with the transcript as body.
   - **(implicit) keep as text** — the transcript is already a Memory body; just Seal.
2. **Photo.** Tap "add a picture" → file input (reuse `addImages`). Optional caption (Source Serif). Saved as Memory.
3. **Write.** "write instead" toggle → keyboard-up textarea (`aria-label="Memory content"`, mirrors Compose's body field). Saved as Memory.

**Default sink — Memory:**
- A single optional field `to: (someone in your bloodline)`. **Empty → Memory** (`memoriesApi.create`, visible on the Deep). **Filled → Letter** (`lettersApi`, recipient required). This mirrors the live `isLetter = !!(recipientId || recipientName.trim())` rule (`Compose.tsx:997`) — reuse that exact predicate.
- `metadata` must route through the worker whitelist (`entryDate`/`dye`/`images`) — see [[worker-metadata-sanitizer-whitelist]]; any new key is silently dropped.

**One commit gesture:** press-and-hold Seal (720ms), copy **"let it settle"** (was "weave it in"). Reuse Compose's press-and-hold ritual (`Compose.tsx:~1245-1325`) + `WeaveCeremony`. Success lands on the real home `/loom/weft` (today Compose lands on `/loom/index`, a *different* surface — fix this).

**Future-letter** keeps its own AI-draft route for now (it's a distinct generative flow); but its *entry point* moves into the cockpit as a "write to the future" affordance that deep-links to `/future-letter`. Not merged in this spec.

**Onboarding wiring:** `Onboarding.tsx`'s first-entry step routes the user through `/capture` (Memory default), removing the current double-ask (FirstThread + Onboarding both request a first entry) and the land-on-`/loom/pwa` dead-end.

---

## Component B — Navigation: 5 → 4 + kill duplicate chrome

**File:** `cloudflare/frontend/src/loom/components/BottomNav.tsx` (`NAV` array, lines 21-27).

**New `NAV` (4 items + center):**

| Slot | Label | Route | Note |
|---|---|---|---|
| 1 | `the deep` | `/loom/weft` | was `cloth` → relabel only; href unchanged |
| 2 | *(center)* `capture` | `/capture` | warm copper field — the record affordance, NOT ∞, NOT the logo |
| 3 | `family` | `/family` | |
| 4 | `you` | `/loom/profile` | merges profile + settings entry |

- The old `memory → /compose` and `voice → /record` slots collapse into the center `capture`.
- **∞ stays** as the single utility drawer (`InfinityMenu.tsx`): search · inbox · on-this-day · export. It is the *only* secondary menu.
- **Delete the `Frame` shell** (`Frame.tsx`) — it renders a second, parallel topbar (logo + counter + `compose →` + SecurityDot) used by exactly **1 page** while 77 use `ClothShell`. Migrate that one page to `ClothShell` and remove `Frame` + its duplicate `routeLabel` map.
- **Wayfinding fix:** every breadcrumb root currently points at one of `/loom`, `/`, `/loom/index`, `/loom/today` (all labelled "heirloom") — none is the actual authed landing `/loom/weft`. Standardize breadcrumb root → `the deep → /loom/weft`.
- **Topbar = context only** (title + append-only counter). No nav links in the topbar.

---

## Component C — Paged reader (collapse 5 ledgers → 1)

**New shared primitive:** `cloudflare/frontend/src/loom/components/PagedReader.tsx`, extracted from `ReadingRoom.tsx`'s existing nav shell. `ReadingRoom` already has: prev/later stepping, a dot pager that collapses to a mono `07 / 142` counter above `DOT_CAP=12` (`:190`, `:196`, `:358-385`), keyboard ←/→ (`:543-562`), per-page scroll reset (`:240-242`), and a left jump drawer (`:753-813`). We promote that shell; we do **not** build paging from scratch and do **not** reuse the ceremony steppers (they're hardcoded panels, not data-driven).

**`<PagedReader>` interface:**
```ts
interface PagedReaderProps {
  pages: PageModel[];        // ordered pages to turn through
  index: number;             // controlled current page
  onIndex: (i: number) => void;
  dye?: string;              // optional left-margin dye thread
  renderPage: (p: PageModel, i: number) => ReactNode;
  jumpLabel?: (p: PageModel) => string;  // label in the jump drawer
}
```
Owns: the hairline-dot/`PagerCounter` footer, ←/→ keyboard, scroll-reset per page, the one easing curve, the jump drawer. No data fetching — pure presentation.

**Two zooms, both rendered by `PagedReader`:**

- **DecadePlane** (landing): one screen = one decade. Fraunces decade title ("The 1980s"), year-span, the member-dye threads present, and a short list of that decade's entries (reuse the existing `EntryRow`). Page with `← 1970s / 1990s →`. Decades come from the existing `decadeOf` logic (already present in `LoomIndex`/`Weft`/`Memories` — consolidate to one helper).
- **EntryPlane** (drill-in): tap an entry row → the existing one-entry reader, stepping within the decade. This is `ReadingRoom` today; it now reads its pages from `PagedReader`.

**Scaling 1 → 500+:**
- **1 entry:** skip the DecadePlane entirely, open straight into the EntryPlane; hide the pager (`total <= 1`). No lonely one-decade rail.
- **5 entries:** 1–2 decade screens; trivial.
- **500+:** DecadePlane caps at ~15 screens regardless of entry count; the entry counter (`07 / 142`) handles within-decade depth.
- **Jump to a specific old memory:** ∞ drawer → decade list → tap decade → tap entry (two taps to any era). Search remains the by-word path (`SearchPage` already deep-links).

**Pagination prerequisite:** the ledgers today cap at `limit: 200` (Memories, Letters) or `500` (Weft/LoomIndex/ReadingRoom) with no server-side paging. For a multi-decade archive this silently truncates. Add **server-side pagination** to the worker memories/letters/voice list endpoints (cursor or `?before=<created_at>&limit=`), and have the DecadePlane fetch per-decade rather than all-at-once. This is the one genuinely new backend piece.

**Consolidation:** `/memories`, `/loom/index`, `/threads`, `/family-feed`, `/on-this-day` all point their "read the thread" action into this reader. The home `/loom/weft` "read" opens the DecadePlane. Two of the redundant ledger routes become unrouted (files kept on disk for one release).

**Contrast / tap-target lift (the bronze complaint):**
- `--bone-faint` is currently `rgba(242,230,208,0.52)` ≈ 4.80:1 — at or below AA for small text. Lift to ≥ AA (raise alpha until ≥ 4.5:1 for body, ≥ 7:1 where it's the only label). Copper (`--warm #e0a062`, 8.71:1 dark) is **untouched** — it passes.
- The Memories edit/unweave/clear controls (`Memories.tsx:192-201`) render in `--bone-faint` with no `min-height`. Give them `min-height: 44px` (tap target) and the lifted token.
- Token changes apply in **both** `globals.css` and `tailwind.config.js` (kept in sync; see [[light-theme-aa-dual-copper-tokens]] — there are two parallel copper families, both must stay AA in light scope; dark untouched).
- Remove the orphan glassmorphism declarations `.dye-veil`/`.dye-glass`/`.dye-chip` (`globals.css:2214-2235`, `backdrop-filter: blur()`) — an ART_DIRECTION anti-pattern, currently unconsumed but hot-loadable.

---

## Component D — Vocabulary reconcile (water, not cloth)

Copy + docs only. **No route or component renames.** ∞ stays everywhere.

| File:line | From | To |
|---|---|---|
| `Compose.tsx:1116` | "weave it in →" | "let it settle →" |
| `Capture.tsx` (new) | — | "let it settle →" (the canonical verb) |
| `Family.tsx:332`, `PhotoQuick.tsx:386`, `PwaWizard.tsx:98` | "weave into cloth →" | "lower into the Deep →" (loading: "settling…") |
| `BottomNav.tsx:22` | nav label `cloth` | `the deep` (href `/loom/weft` unchanged) |
| `InfinityMenu.tsx:17,67,85` | "the cloth, to keep" / "the cloth's artifacts" | "the Deep, to keep" / "what the Deep holds" |
| `HelpSupport.tsx:36` | "weave it into the cloth" | "lower it into the Deep" |
| `Marketing.tsx:233` | "sealed the moment you weave it in" | "sealed the moment it settles" |
| `HLogo.tsx:1` | self-desc "the Cosmic Loom mark" | Deep-native gloss (glyph art unchanged) |
| `ART_DIRECTION.md`, `CLAUDE.md` | cloth constitution, Cormorant/Spectral fonts | The Deep water constitution + live Fraunces/Source Serif fonts; canonical vocabulary line `the Cloth → the Deep`, etc. |

The canonical verb is **"let it settle"** (commit) with secondary water verbs *lower / descend / rest / hold*. Reserve *sink/drown* (too dark for a memorial product).

---

## Data flow

```
Capture (voice)  → MediaRecorder → aiApi.transcribe → transcript (editable)
   ├ keep voice  → voiceApi.create  → mirrorIntoDefaultThread → visible on Deep
   ├ + photo     → addImages + memoriesApi.create(metadata: {images,...})
   └ text only   → memoriesApi.create   (Memory, no recipient)
        └ recipient field filled? → lettersApi  (Letter)
   commit: press-hold Seal 720ms → WeaveCeremony → navigate('/loom/weft')

Read  → list endpoint (paginated) → group by decadeOf → DecadePlane pages
        → tap entry → EntryPlane (PagedReader over that decade's entries)
```

## Error handling

- **Transcription failure** (Whisper down / no audio): keep the recording, show inline status (no toast) "couldn't transcribe — keep as voice or try again." Voice still saveable via `voiceApi.create`.
- **Save failure:** inline status under the Seal control; do not navigate; preserve the draft in component state.
- **Encrypted descriptions:** search already decrypt-scans via `readDescription` (fixed this session). The reader reads through `readDescription` server-side; no client change needed. See [[two-disjoint-entry-stores]], [[seal-enforcement-server-side]] — sealed entries must stay redacted server-side in any new list endpoint.
- **Empty/sparse states:** 0 entries → the existing first-entry invitation (one voice, not the 4 divergent ones today). 1 entry → straight to EntryPlane.

## Testing

- **Worker typecheck gate:** `cd cloudflare/worker && npx tsc --noEmit` (0 errors) — pagination endpoint changes.
- **Frontend build gate:** `cd cloudflare/frontend && npm run build` (tsc && vite build, currently clean).
- **Playwright on prod** (post-deploy, the established pattern): a lifetime E2E that (1) captures a Memory via `/capture` voice→text→seal and asserts it on the Deep, (2) captures a Letter (recipient set) and asserts it routes to the recipient not the home cloth, (3) pages the DecadePlane → EntryPlane with keyboard arrows, (4) confirms the 4-item nav and that old capture routes still resolve (unrouted-but-present safety), (5) contrast spot-check that edit/unweave controls are ≥44px. Minimize repeated signups — each is a real prod account.
- **SW cache bump:** bump `CACHE` version in `public/sw.js` (currently `heirloom-v197-deep`) on the frontend deploy — see [[feedback-pwa-sw-cache-bump]]. Worker-only changes need no bump.

## Rollout order (informs the plan)

1. Vocabulary + docs (D) + contrast tokens (C-partial) — low-risk, ships independently.
2. `PagedReader` extraction (C) — refactor `ReadingRoom` onto it with no behavior change, verify, *then* add DecadePlane.
3. Worker pagination (C) — additive endpoint, typecheck.
4. `/capture` cockpit (A) — new route; wire onboarding through it.
5. Nav 5→4 + delete `Frame` (B) — last, after `/capture` exists so the center action has a target.

## Open prerequisites (not blockers, but the plan must sequence them)

- Server-side pagination is the only new backend surface; everything else is consolidation of shipped parts.
- `Frame.tsx` deletion requires migrating its single consumer to `ClothShell` first.
