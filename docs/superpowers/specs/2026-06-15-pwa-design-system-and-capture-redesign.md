# Heirloom PWA Design System + Capture Redesign — Design Spec

**Date:** 2026-06-15
**Status:** Approved (design); pending spec review
**Tree:** `cloudflare/frontend` (the deployed app)

## Goal

Make every PWA screen legible and coherent by (1) fixing the readability/veil failure
across all routes, (2) extracting one reusable **Room** design system from the approved
`/loom/pwa` capture redesign, (3) mapping all 89 screens onto four visual anchors, and
(4) ensuring the two capture features — voice→text and AI writing help — are wired on
both the Write and Speak flows.

## Problem

- `/loom/pwa` and `/loom` are in `HOME_ROUTES` → cloth at full presence, veil opacity 0 →
  text washes out over the glowing CosmicLoom. The live page is "almost impossible to see."
- The 89 screens drifted: inconsistent headers, spacing, type, hierarchy.
- **Record** (Speak) saves a voice memory but never transcribes — the Whisper backend
  (`/ai/transcribe`) exists and is unused there; transcript is manual-only.

## Architecture

A small shared **Room system** + per-route veil control. Screens compose Room primitives;
each maps to one of four visual **anchors**. No worker/DB schema changes. The voice→text
and refine backends already exist (`/ai/transcribe` Whisper, `/ai/refine`); work is
frontend wiring + UI.

### Veil-per-route (the readability fix)

`ClothBackdrop.tsx` currently: `HOME_ROUTES = Set(['/loom','/loom/pwa'])`; veil div
opacity `present ? 0 : 0.97`. Change to three veil modes keyed by route:

- **`full`** — `/loom` only. Cloth at full presence, no veil (unchanged).
- **`band`** — `/loom/pwa`. Vertical veil: cloth visible top band (~38vh), transparent →
  solid ink below ~32vh, so the capture block reads while the cloth stays touchable.
- **`room`** — every other route. The existing radial ink veil
  (`radial-gradient(ellipse 76% 88% at 50% 46%, var(--ink) 38%, … transparent 92%)`),
  opacity ~0.97 — text always legible.

Implementation: replace the boolean `present` with a `veilMode` derived from `pathname`.
`band` mode renders a vertical-gradient veil instead of the radial one. `/loom/pwa`
leaves `HOME_ROUTES`-style full presence but gains the band veil; CosmicLoom stays
interactive in the top band.

### Room primitives (new shared components)

Create `src/loom/components/room/`:

- **`RoomHeader.tsx`** — `{ eyebrow?, title, lede? }`. Mono uppercase eyebrow (`--bone-faint`,
  letter-spacing 0.24em) → Source Serif title → optional `--bone-dim` lede. Left-aligned,
  uses `--page-pad-*`. The single header pattern for every screen.
- **`RoomSection.tsx`** — `{ label?, children }`. Hairline `--rule` top divider + optional
  mono micro-label; vertical rhythm wrapper. No cards, no boxes.
- **`CapturePills.tsx`** — `{ writeHref?, speakHref?, onWrite?, onSpeak? }`. The co-equal
  `Write →` / `Speak →` pills (warm outline + ghost), reused anywhere capture is offered.
- **`RoomRow.tsx`** — `{ dye?, title, meta?, href }`. One hairline list row: 6px dye dot
  (glow), serif title, mono meta. The Thread/List atom.

These wrap existing tokens (`--page-pad-x/-top/-clear`, `--ink-card`, `--rule`, `--warm`,
type scale). No new color tokens. ART_DIRECTION compliant (no icons, no spinners → ProgressHair,
no toasts, no avatar circles, one warm accent <3%).

### Four anchors (every screen maps to one)

1. **Capture** — RoomHeader (Listener eyebrow + prompt) + CapturePills. Inherited by:
   PwaHome, Compose, Record, DailySentence, PhotoQuick, ThreadCompose, ComposeLetter,
   FutureLetter, InterviewMode, + Entity/detail (Family, FamilyDetail, PersonPage,
   ThreadDetail) + Form/wizard screens (Onboarding, QuickWizard, Join, Invite, Settings,
   Billing, Login, Signup, Forgot/Reset, VerifyEmail, all Gift/*).
2. **Thread/List** — RoomHeader + RoomSection + RoomRow list + see-all. Inherited by:
   Memories, Letters, ThreadsIndex, FamilyFeed, Inbox, Milestones, LifeEvents, OnThisDay,
   StoryArtifact, TimeCapsule, Challenges, Streaks, Referrals, MemoryCards, Memorials.
3. **Reading room** — single immersive entry, left dye margin, narrow measure. Inherited by:
   LetterRoom, VoiceRoom, ReadingRoom, Echo, Weft, TiedOff, StoryView, CardView,
   MemoryRoom, Today.
4. **Artifact builder** — preview + quiet controls + one warm CTA. Inherited by:
   BookBuilder, BookPage, Wrapped, ExportPage.

**Marketing/landing** (Landing, Pricing, Founder, Showcase, /for/*, FoundersWall, LegacyPlan,
Help, Contact, Privacy, Terms, Memorials public) and **Status/utility** (Offline, NotFound,
*Success, *Redeem, Threshold, Unlock, Admin) inherit primitives (header/veil/type) only —
text-layout pass, no anchor render.

### Capture redesign — `/loom/pwa` (approved, layout C)

Capture-first home. Listener prompt is the hero; `Write →` (`/compose`) and `Speak →`
(`/record`) co-equal. Below: last 3 woven memories (RoomRow) + see-all, quiet nav row
(`letters · family · book · ask`), stats folded to one status line. Touchable veiled cloth
band on top (band veil mode). Existing states preserved (visitor/reader/successor/new-user/
active-author branches in `AuthHome`).

### Listener rotation (every open/login)

`useListener.ts` currently returns one prompt by `dayOfYear` via `useMemo`. Change to rotate
on every open: persist last index in `localStorage` (`heirloom.listener.lastIdx`), advance to
a different index each mount (no immediate repeat), cycle the 52-prompt pool. Add a `reroll()`
returning the next prompt + a `↻` re-roll affordance on home.

### Voice→text + AI writing help (both flows)

- **Write (Compose):** already wired — `VoiceRefine` (Whisper transcribe → `/ai/refine` 3
  variants + warmer/shorter/plainer nudge). No change beyond Room-system styling consistency.
- **Speak (Record):** wire transcription. After `recorder.onstop` (or post-upload), call
  `aiApi.transcribe({ audioUrl })` with the recording (data URL via FileReader, mirroring
  VoiceRefine's `blobToDataUrl`), auto-populate the `transcript` field, show `ProgressHair`
  ("listening to your words…") while it runs, keep the field editable, and graceful-fail to
  the manual field on empty/error (never block save). Offer an inline "find better words"
  refine on the transcript (reuse `VoiceRefine`'s refine path / `aiApi.refine`). The saved
  voice memory then carries searchable transcript text.

## Components / files

| File | Change |
|---|---|
| `src/loom/components/ClothBackdrop.tsx` | veil-per-route: `full`/`band`/`room` modes |
| `src/loom/components/room/RoomHeader.tsx` | new |
| `src/loom/components/room/RoomSection.tsx` | new |
| `src/loom/components/room/CapturePills.tsx` | new |
| `src/loom/components/room/RoomRow.tsx` | new |
| `src/pages/PwaHome.tsx` | rebuild AuthHome capture-first (layout C); drop deprecated `backdropOpacity` |
| `src/hooks/useListener.ts` | rotate every open + `reroll()` |
| `src/pages/Record.tsx` | auto-transcribe after stop + inline refine |
| 89 screens (incremental) | map to anchor, adopt Room primitives |
| `cloudflare/frontend/public/sw.js` | bump CACHE version on deploy |

## Rollout

1. Foundation PR: veil-per-route + Room primitives + `useListener` rotation.
2. Capture: PwaHome rebuild + Record transcription wiring.
3. Anchor sweep: Thread/List, Reading room, Artifact builder screens adopt primitives.
4. Marketing/status text-layout pass.
5. Per batch: `npm run build` (typecheck gate, 0 errors), sw.js CACHE bump, deploy, smoke live.

## Testing

- `npm run build` (`tsc && vite build`) clean after every batch.
- Manual smoke on live `heirloom.blue` after deploy (CSP: no inline scripts — external
  same-origin only; SW precache).
- Record: record → transcript auto-fills → refine → save; verify transcript persists and is
  searchable (worker `memories.ts` searches `transcript`).
- Veil: visit `/loom` (full), `/loom/pwa` (band, legible), a room route (radial, legible).

## Non-goals

- No worker/DB schema changes (transcribe/refine backends exist).
- No redesign of marketing/legal layout structure — primitives/legibility only.
- No new color tokens, icons, spinners, or toasts.

## Constraints (carried)

ART_DIRECTION constitution. Edit `cloudflare/frontend` only. CosmicLoom stays the live cloth.
Prod CSP has no `unsafe-inline`. Worker metadata sanitizer drops non-whitelisted keys. Bump
`sw.js` CACHE every significant deploy. Smoke live after deploy.
