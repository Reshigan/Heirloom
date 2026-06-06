# Wave 1 — Navigation Redesign + New Rooms

**Date:** 2026-06-06  
**Status:** Approved  
**Scope:** Bottom navigation restructure, Letter Room, Voice Room, inline playback, always-editable-by-author rule

---

## 1. Context

The current bottom nav (cloth | compose | ∞ | letters | listen) has three problems the user identified:

1. **"compose" conflates memories and letters** — the same flow handles both, hidden behind a "To:" field. Users can't tell the difference from the nav.
2. **"listen" doesn't say voice recording** — it goes to the AI echo (Echo.tsx), not the voice recorder. The recorder (/record) is buried inside the compose flow.
3. **"letters" is reading-only** — it shows sealed letters but doesn't surface the letter composer. `ComposeLetter.tsx` exists but is unrouted.

---

## 2. New Navigation Structure

```
cloth | memory | ∞ | letter | voice
```

| Item | Route | What it opens |
|---|---|---|
| cloth | /loom/weft | Tapestry/weft view — unchanged |
| memory | /loom/composer | Composer.tsx directly — text memory (photo added in Wave 2) |
| ∞ | /loom/home | PWA home — unchanged |
| letter | /loom/letter | **Letter Room** — see + seal new letter |
| voice | /loom/voice | **Voice Room** — see + record new voice thread |

The AI Listener (currently "listen" nav item / Echo.tsx) is removed from the primary nav. It surfaces as an ambient line on Today.tsx — it is already rendered there under "the listener". No functionality is lost; it simply stops competing with voice recording for nav real estate.

---

## 3. Letter Room

**Route:** `/loom/letter`  
**Component:** `cloudflare/frontend/src/loom/pages/LetterRoom.tsx` (new)

### Layout

- Topbar: `← cloth` left | `letters` center
- **CTA at top:** warm left-border strip — `seal a new letter →` — navigates to `/loom/compose-letter` (routes ComposeLetter.tsx, which was previously unrouted)
- **Letter list** below CTA — three categories shown in one unified list, distinguished by status metadata:
  - Letters the user **wrote** (sealed or delivered) — show `read` + `edit` affordances
  - Letters **received** by the user — show `read` only

### Each letter row

```
[3px dye border] [to/from: Name · status]   [read]  [edit?]
                 [serif italic excerpt]
                 [delivery metadata]
```

- Left border: sender's dye color (madder, indigo, etc.)
- Status: `sealed`, `delivered`, `received`
- `read` → navigates to the letter detail view
- `edit` → navigates to ComposeLetter.tsx in edit mode — **only shown on letters the user wrote**

### Author edit rule (non-negotiable)

> "Sealed" is a delivery constraint for the recipient. It is **not** an edit lock for the author. The user who wrote a letter can read and edit it at any time — before sealing, after sealing, after delivery. This applies permanently.

Backend implication: the PATCH /letters/:id endpoint must not reject edits from the author based on sealed/delivered status. The worker's existing letter routes need to be verified against this rule.

### Empty state

First-run with no letters: display the sealed-letter first-run prompt already on Today.tsx (reuse the copy: "There is someone who needs to read this. Just not yet.") with a single CTA to seal their first letter.

---

## 4. Voice Room

**Route:** `/loom/voice`  
**Component:** `cloudflare/frontend/src/loom/pages/VoiceRoom.tsx` (new)

### Layout

- Topbar: `← cloth` left | `voice` center
- **CTA at top:** warm left-border strip — `record a voice thread →` — navigates to `/record` (Record.tsx)
- **Voice list** below CTA — all voice recordings the family has made, sorted most-recent first

### Each voice row

```
[3px dye border] [author · duration]        [▶]  [edit?]
                 [serif italic title/excerpt]
                 [abstract waveform]
```

- Left border: author's dye color
- `▶` plays the recording inline (HTML `<audio>` element, revealed below the row on tap) — no separate player page
- `edit` → navigates to an edit view — **only shown on recordings the user authored**
- Abstract waveform: 12 vertical hairline bars of varying heights, rendered at fixed values (not real waveform data) — visual texture only

### Author edit rule (non-negotiable)

Voice threads are always editable by their author — re-record (replace audio), update title, or delete. There is no "sealed" state for voice. Other family members can play any recording but cannot edit it.

### Empty state

First-run with no recordings: prompt with "Record your voice. Your family will hear it long after you're gone." + CTA to record first thread.

---

## 5. What moves, what stays

| Before | After |
|---|---|
| `compose` nav → Composer.tsx | Renamed `memory` in nav. Route unchanged. No functional change. |
| `letters` nav → Letters.tsx (reading room) | Renamed `letter`. Letters.tsx content absorbed into LetterRoom.tsx. |
| `listen` nav → Echo.tsx (AI echo) | Removed from nav. Echo/Listener stays on Today.tsx as ambient line. Accessible via /loom/today. |
| `/record` route | Unchanged. Now surfaced as the CTA action from VoiceRoom, not a standalone nav item. |
| `ComposeLetter.tsx` | Finally routed: `/loom/compose-letter`. Reached via Letter Room CTA and edit actions. |

---

## 6. Files to create / modify

### New files

| File | Purpose |
|---|---|
| `cloudflare/frontend/src/loom/pages/LetterRoom.tsx` | Letter Room page |
| `cloudflare/frontend/src/loom/pages/VoiceRoom.tsx` | Voice Room page with inline playback |

### Modified files

| File | Change |
|---|---|
| `cloudflare/frontend/src/loom/components/BottomNav.tsx` | Update labels (compose→memory, letters→letter, listen→voice), update routes (/loom/read→/loom/letter, /loom/echo→/loom/voice) |
| `cloudflare/frontend/src/App.tsx` | Add `/loom/letter` → LetterRoom, `/loom/voice` → VoiceRoom routes. Add `/loom/compose-letter` → ComposeLetter route. |
| `cloudflare/frontend/src/pages/Letters.tsx` (or equivalent) | Add author edit affordance to letter rows — `edit` link shown when `letter.authorId === currentUserId` |
| `cloudflare/frontend/src/pages/Record.tsx` | Expose inline playback on past recordings list; add edit/delete affordances for author |

### Worker (verify, may not need changes)

| File | Verify |
|---|---|
| `cloudflare/worker/src/routes/letters.ts` | PATCH route must allow author edits regardless of sealed/delivered status |

---

## 7. Design constraints (from design constitution)

- **No icons** — `▶` is a Unicode character used as text, not an icon library glyph. Abstract waveform is CSS `div` bars, not SVG icons.
- **0px radius** on all interactive affordances.
- **Dye left-border** (3px solid) is the only color signal. No dye fills, no dye backgrounds.
- **Inline status** only — no toasts on save/edit. Hairline progress bar if async action in flight.
- `edit` link: monospace, `font-size: 10px`, `letter-spacing: 0.18em`, `text-transform: uppercase`, `color: var(--warm)` at reduced opacity, `border-bottom: 1px solid` underline affordance.
- Transitions: `cubic-bezier(0.16,1,0.3,1)`, 180ms for micro (link hover), 360ms for reveal, 720ms for page entry.

---

## 8. Out of scope (later waves)

- **Wave 2:** Photo upload — attaches to the memory composer flow
- **Wave 3:** Background ambient animation — color blocks filling with subtle glow across login, web, app
- **Not this wave:** Redesigning the memory composer itself, changing the cloth view, altering the ∞ home/PWA
