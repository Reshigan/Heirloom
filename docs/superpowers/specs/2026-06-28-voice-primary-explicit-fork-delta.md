# Voice-Primary Capture — Explicit Fork + Entry-Point Sweep (delta)

**Date:** 2026-06-28
**Status:** Approved (design); building
**Builds on:** [2026-06-26-the-deep-capture-cockpit-and-consolidation-design.md](2026-06-26-the-deep-capture-cockpit-and-consolidation-design.md). That spec built `/capture` (Capture.tsx) with **implicit** routing (recipient field filled = letter, empty = memory). This delta makes the convert choice **explicit**, swaps the nav center to the ∞ mark, and sweeps the scattered add-CTAs into the one door.

## Why

A letter/memory/voice can still be started from ~30 scattered CTAs across 12 screens plus 5 parallel route-surfaces. The cockpit exists but competes with them instead of replacing them, and its voice→letter→memory routing is a hidden side-effect of whether the "to:" field happens to be filled. The user asked: voice the primary input, with an explicit option to convert to letter or memory.

## Three moves

### 1. Explicit 3-way fork in Capture.tsx

After record → transcribe, replace the implicit recipient-driven routing with a deliberate choice presented under the editable transcript:

```
   keep as voice   ·   make a letter   ·   let it settle as a memory
```

- **keep as voice** → `voiceApi.create` (audio + transcript). (Today: a "keep as voice" checkbox.)
- **make a letter** → reveals the RecipientPicker (a letter needs someone) → `lettersApi.create`.
- **let it settle as a memory** (default) → `memoriesApi.create`. A photo forces this branch.

State: replace the `keepAsVoice` boolean + implicit `isLetter` predicate with a single `intent: 'voice' | 'letter' | 'memory'` (default `'memory'`). The save mutation switches on `intent`, not on the recipient field. The RecipientPicker shows only when `intent === 'letter'`. Seal copy + ceremony unchanged ("let it settle →"). Photo path: when a photo is attached, force `intent = 'memory'` and hide the fork (a picture is always a memory). "write instead" still skips the record ring. Same three APIs, same metadata whitelist (`entryDate`/`dye`/`images`) — no schema change.

### 2. BottomNav center = ∞ mark

`BottomNav.tsx` `NAV[1]` center currently renders the word `capture`. Render the `∞` glyph instead (warm `--warm` when active, `--bone-dim` inactive), `aria-label="Capture"`. Other 3 tabs stay typographic words (`the deep` · ∞ · `family` · `you`). This is the one bare mark the product allows; route unchanged (`/capture`).

### 3. Sweep scattered add-CTAs → /capture

Repoint the **add** CTAs below to `/capture`. Where a screen shows a multi-door trio (write/photo/voice), collapse to **one** link: `speak something →`.

| File | Lines | Action |
|---|---|---|
| Memories.tsx | 372-374, 447-453 | two trios → one `speak something →` each |
| Today.tsx | 178, 261 | `/record` → `/capture` |
| Weft.tsx | 216 | `EmptyThread` onWeave + onRecord → both `/capture` |
| PwaHome.tsx | 243, 246, 467 | → `/capture` (collapse the write+record pair) |
| VoiceRoom.tsx | 255, 296 | `/record` → `/capture` |
| OnThisDay.tsx | 135 | `/compose` → `/capture` |
| TiedOff.tsx | 281 | `/compose` → `/capture` |
| Unlock.tsx | 612 | `/compose` → `/capture` |
| ReadingRoom.tsx | 403, 853 | `/compose` → `/capture` (NOT 635-636, those are edit) |
| Letters.tsx | 72, 170 | `/letters/new` → `/capture` (NOT 255, edit) |

**Keep as-is (not noise — deliberate or edit links):**
- `?id=` / `?entry=` edit links: Letters.tsx:255, ReadingRoom.tsx:635-636, Compose.tsx (edit) — open an existing entry, must stay.
- Family.tsx:661,675 — "write/record to THIS member" with `?recipientId=` prefill = a deliberate letter to a named person; keep the prefill.
- InterviewMode.tsx, QuickWizard.tsx internal `navigate('/record')` — these are the flow's own per-answer/commit mechanism, not scattered doors.
- Compose.tsx:1624 — Compose is the "more options" surface; its internal "speak instead" escape hatch may stay.
- Streaks.tsx:179,192 — route retired/unrouted already; skip.
- Frame.tsx:404 — Frame deletion is the parent spec's job, out of this delta's scope.

## Non-goals
- No route renames, no store merge, no new mark beyond the existing ∞.
- PagedReader / pagination / Frame deletion (parent spec) — not in this delta.
- Memories scroll friction + contrast — separate follow-up.

## Testing
- `cd cloudflare/frontend && npm run build` (tsc && vite build) clean.
- Manual: record → all three fork branches save to the right store and land on `/loom/weft`; photo hides the fork; nav center shows ∞ warm-when-active.
- Bump `public/sw.js` CACHE on deploy ([[feedback-pwa-sw-cache-bump]]).
- Smoke LIVE after deploy (CSP) ([[csp-blocks-inline-scripts-prod-only]]).
