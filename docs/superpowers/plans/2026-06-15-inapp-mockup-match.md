# In-App Screen Mockup-Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the authed in-app screens so their layout matches the 2026-06-15 Higgsfield "cosmic" mockups in `.higgsfield/golive/today/`, while preserving every existing data hook, mutation, route, and behavior.

**Architecture:** Add one shared cosmic-primitives module (`src/loom/cosmic/CosmicUI.tsx`) holding the repeating mockup elements (mono eyebrow + centered serif title header, warm-dot entry rows, mono section labels, wax ∞ seal, meta rows). Each screen task then re-skins its existing page to the mockup using those primitives — JSX/layout changes only, never touching the data layer (queries/mutations/api calls/navigation stay byte-identical in behavior). Work on a feature branch so the deploy-on-push-to-main pipeline never ships a half-rebuilt set; merge once after the final validation pass.

**Tech Stack:** React 18 + Vite + TS strict + Tailwind. CSS tokens in `src/styles/globals.css` (`--ink`, `--bone`, `--bone-dim`, `--warm`, `--warm-bright`, `--serif`, `--sans`, `--mono`, `--rule`, `--ease`). Playwright (devDep) for screenshot validation.

**The mockup design system (shared across all screens):**
- Background pure `--ink` `#0e0e0c`. NO filament backdrop inside app screens (filament is the global `ClothBackdrop`/`CosmicLoom` layer behind everything already — do not add per-screen).
- **Header:** small uppercase JetBrains-Mono eyebrow in `--bone-dim`, letter-spacing ~0.25em, centered; below it a large Source-Serif title in `--bone`, centered.
- **Warm accent only:** small filled warm dot (`•`, ~6px, `--warm`) as list bullets; `∞` wax seal; warm text for primary CTAs and "Sign out". Warm stays under ~3% surface.
- **List row:** `[warm dot] [serif title]` left, `[mono date]` right-aligned in `--bone-dim`; thin `--rule` divider; generous vertical padding.
- **Section label:** uppercase mono in `--bone-faint`, used to group results.
- Generous negative space; titles centered; durations 180/360/720ms; easing `--ease`.

**Reference mockups (exact files):**
| Screen | Page file | Mockup |
|---|---|---|
| Home | `src/pages/PwaHome.tsx` | `.higgsfield/golive/today/cosmic-home.png` |
| Thread | `src/pages/Weft.tsx` | `cosmic-thread.png` |
| Family | `src/pages/Constellation.tsx` | `cosmic-tree.png` |
| Composer | `src/pages/Compose.tsx` | `cosmic-composer.png` |
| Settings | `src/pages/Settings.tsx` | `cosmic-settings.png` |
| Voice | `src/pages/VoiceRoom.tsx` | `cosmic-voice.png` |
| Reading | `src/pages/ReadingRoom.tsx` | `cosmic-reading.png` |
| Inbox | `src/pages/Inbox.tsx` | `cosmic-inbox.png` |
| Search | `src/pages/SearchPage.tsx` | `cosmic-search.png` |

**Hard rules for every task:**
1. **Preserve functionality.** Do not remove or rename any `useQuery`/`useMutation`/`use*Store`/`*Api.*`/`navigate(`/route. Re-skin the markup around them. After each task, grep-confirm the listed anchors still exist.
2. **No new dependencies, no icons, no spinners, no glass/gradient, no avatar circles, no toasts.** (ART_DIRECTION.) Warm dots and the ∞ seal are allowed (they are in the mockups).
3. **Build gate:** `npm run build` must exit 0 (tsc + vite).
4. **Validate visually:** re-render the screen locally authed and montage it against its mockup (harness in Task 0).
5. **Commit per screen** on the branch with the trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 0: Branch, shared cosmic primitives, validation harness

**Files:**
- Create: `cloudflare/frontend/src/loom/cosmic/CosmicUI.tsx`
- Reuse (already exist): `cloudflare/frontend/scripts/mock-authed-shots.mjs`, `cloudflare/frontend/scripts/montage-b64.mjs`

- [ ] **Step 1: Create the feature branch** (deploy-on-push safety)

```bash
cd /Users/reshigan/Heirloom && git checkout -b redesign/inapp-mockup-match
```

- [ ] **Step 2: Create the shared cosmic primitives**

Create `cloudflare/frontend/src/loom/cosmic/CosmicUI.tsx`:

```tsx
import type { ReactNode } from 'react';

/** mono uppercase eyebrow + centered serif title — the mockup header on every screen */
export function CosmicHeader({ eyebrow, title, align = 'center' }: { eyebrow: string; title: ReactNode; align?: 'center' | 'left' }) {
  return (
    <header style={{ textAlign: align, marginBottom: 36 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>{eyebrow}</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 34, lineHeight: 1.1, color: 'var(--bone)', marginTop: 10, fontWeight: 400 }}>{title}</h1>
    </header>
  );
}

/** small filled warm dot — the only bullet mark */
export function WarmDot({ filled = true, size = 6 }: { filled?: boolean; size?: number }) {
  return <span aria-hidden style={{ width: size, height: size, borderRadius: '50%', background: filled ? 'var(--warm)' : 'transparent', border: filled ? 'none' : '1px solid var(--warm-dim)', flex: '0 0 auto', display: 'inline-block' }} />;
}

/** list row: dot + serif title (+optional sub) left, mono meta right */
export function EntryRow({ title, sub, meta, italic, onClick }: { title: ReactNode; sub?: ReactNode; meta?: ReactNode; italic?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 14, width: '100%', textAlign: 'left', padding: '16px 0', borderBottom: '1px solid var(--rule)', background: 'none', border: 'none', borderBottomStyle: 'solid', cursor: onClick ? 'pointer' : 'default', transition: 'opacity 180ms var(--ease)' }}>
      <span style={{ marginTop: 8 }}><WarmDot /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: italic ? 'italic' : 'normal', fontSize: 18, color: 'var(--bone)', display: 'block' }}>{title}</span>
        {sub && <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--bone-dim)', display: 'block', marginTop: 3 }}>{sub}</span>}
      </span>
      {meta && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'var(--bone-dim)', whiteSpace: 'nowrap', marginTop: 4 }}>{meta}</span>}
    </button>
  );
}

/** uppercase mono group label (MEMORIES / LETTERS / VOICES) */
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--bone-faint)', margin: '28px 0 6px' }}>{children}</div>;
}

/** the ∞ wax seal — the product's only mark */
export function WaxSeal({ size = 30 }: { size?: number }) {
  return <div aria-hidden style={{ textAlign: 'center', color: 'var(--warm)', fontSize: size, lineHeight: 1, opacity: 0.9 }}>∞</div>;
}
```

- [ ] **Step 3: Build gate**

Run: `cd cloudflare/frontend && npm run build`
Expected: exit 0, no TS errors. (CosmicUI is unused until screens import it — tree-shaken; build still passes.)

- [ ] **Step 4: Confirm the screenshot harness runs**

Ensure dev server is up (`npm run dev` → http://localhost:5173), then:
Run: `node scripts/mock-authed-shots.mjs`
Expected: prints one line per route with `errs=0` for pwa/weft/voice/kin/settings/compose/search and writes PNGs to `/private/tmp/heirloom-shots/authed/`.

- [ ] **Step 5: Commit**

```bash
cd /Users/reshigan/Heirloom
git add cloudflare/frontend/src/loom/cosmic/CosmicUI.tsx cloudflare/frontend/scripts/mock-authed-shots.mjs cloudflare/frontend/scripts/montage-b64.mjs docs/superpowers/plans/2026-06-15-inapp-mockup-match.md
git commit -m "feat(loom): shared cosmic UI primitives + authed screenshot harness

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 1: Home — `src/pages/PwaHome.tsx` → `cosmic-home.png`

**Files:** Modify `cloudflare/frontend/src/pages/PwaHome.tsx`

**Mockup target:** centered. (a) top: the existing global filament shows through (keep page background transparent over `ClothBackdrop`). (b) mono eyebrow `THE LISTENER ASKS`. (c) big centered Source-Serif question = the Listener prompt (`prompt` from `useListener()`). (d) twin outline pills **WRITE** | **SPEAK** side by side (warm 1px border, mono label) → WRITE navigates to `/compose`, SPEAK to `/record`. (e) three suggestion chips below, each `[warm dot] serif label` — derive from `entries`/reroll suggestions if available, else the three static prompt seeds `Grandma's Recipe` / `The Old Oak Tree` / `A Forgotten Song`; clicking a chip routes to `/compose` with the seed as the prompt query param.

**Preserve (grep must still find these after):** `useRole`, `useTapestryEntries`, `useListener` (`prompt`, `reroll`), `useIsNewUser`, `useAuthStore`, `memoriesApi.getStats`, `shouldShowWizard`, any onboarding-wizard branch, and the bottom nav (CLOTH / MEMORY / LETTER / VOICE).

- [ ] **Step 1:** Read `cosmic-home.png` and the full current `PwaHome.tsx`.
- [ ] **Step 2:** Replace the hero block markup (entry-no / "There is someone who needs to read this" / single sealed-letter CTA) with: `CosmicHeader eyebrow="THE LISTENER ASKS"` rendered as eyebrow-only (no big title), then the `prompt` text as the large centered serif question, then a flex row of two `WRITE`/`SPEAK` outline pills, then three suggestion chips using `WarmDot`. Keep the Listener reroll affordance (tap question to `reroll()`).
- [ ] **Step 3:** Keep the existing bottom nav and the new-user wizard branch untouched.
- [ ] **Step 4: Build gate** — `npm run build` → exit 0.
- [ ] **Step 5: Validate** — `node scripts/mock-authed-shots.mjs` then montage just this pair:
  Run: `node scripts/montage-b64.mjs` (it includes pwa↔cosmic-home). Open `/private/tmp/heirloom-shots/CONTACT-authed.png`; confirm eyebrow, centered question, WRITE|SPEAK pills, 3 chips present and matching.
- [ ] **Step 6: Preserve-check** — `grep -nE "useListener|useTapestryEntries|memoriesApi.getStats|useIsNewUser|shouldShowWizard" src/pages/PwaHome.tsx` must return all.
- [ ] **Step 7: Commit** `feat(loom): rebuild Home to cosmic-home mockup` + trailer.

---

### Task 2: Thread — `src/pages/Weft.tsx` → `cosmic-thread.png`

**Files:** Modify `cloudflare/frontend/src/pages/Weft.tsx`

**Mockup target:** eyebrow `RECENTLY WOVEN`; centered serif title `The Thread`; a single chronological list where each row = `[warm dot] [italic serif entry title]` with the entry date in mono on the line below (left, small), newest first; a centered `∞` `WaxSeal` at the bottom of the list. Merge the existing memories + letters + voice + received feeds into one date-sorted list (the data is already fetched).

**Preserve:** `useQuery` blocks for `memoriesApi.getAll`, `lettersApi.getAll`, `voiceApi.getAll`, `lettersApi.received`, `threadsApi.listMembers`; `WeftMode`/`mode` state may stay but the default view must be the mockup list; `useAuthStore`, `useNavigate`. Row click must still open the entry (existing navigation target).

- [ ] **Step 1:** Read `cosmic-thread.png` + current `Weft.tsx`.
- [ ] **Step 2:** Build a unified `entries` array from the four queries (title + date + route), sorted desc by date. Render `CosmicHeader eyebrow="RECENTLY WOVEN" title="The Thread"`, then map to `EntryRow italic title={t} sub={formattedDate} onClick={()=>navigate(route)}`, then `<WaxSeal/>`.
- [ ] **Step 3:** Keep the century/mode machinery behind the scenes if present, but show the mockup list by default.
- [ ] **Step 4: Build gate** → exit 0.
- [ ] **Step 5: Validate** montage weft↔cosmic-thread.
- [ ] **Step 6: Preserve-check** `grep -nE "memoriesApi.getAll|lettersApi.getAll|voiceApi.getAll|lettersApi.received|threadsApi.listMembers" src/pages/Weft.tsx` all present.
- [ ] **Step 7: Commit** `feat(loom): rebuild Thread to cosmic-thread mockup` + trailer.

---

### Task 3: Family — `src/pages/Constellation.tsx` → `cosmic-tree.png`

**Files:** Modify `cloudflare/frontend/src/pages/Constellation.tsx`

**Mockup target:** eyebrow `THE BLOODLINE`; centered serif title `Family Tree`; a genealogical tree — generations stacked vertically, each member = serif name + small mono `AGE NN` beneath, connected by thin `--rule` vertical/horizontal connector lines; warm dot marks each node. Root ancestor at top, descendants branching down.

**Preserve:** `familyApi.getAll`, `threadsApi.listEntries` + `memoriesApi.getAll` fallback, `resonances` computation, `useAuthStore`, `kin`/`hovered`/`error` state, any node click/hover behavior.

- [ ] **Step 1:** Read `cosmic-tree.png` + current `Constellation.tsx`.
- [ ] **Step 2:** Replace the current "Family Tree" simple layout with a generation-grouped tree: group `kin` by generation/relationship, render rows of member nodes (serif name + mono age), draw connectors with bordered flex containers (no SVG library; CSS borders only). Header via `CosmicHeader`.
- [ ] **Step 3:** Keep hover/resonance highlighting wired to existing state.
- [ ] **Step 4: Build gate** → exit 0.
- [ ] **Step 5: Validate** montage kin↔cosmic-tree.
- [ ] **Step 6: Preserve-check** `grep -nE "familyApi.getAll|threadsApi.listEntries|memoriesApi.getAll|resonances" src/pages/Constellation.tsx` all present.
- [ ] **Step 7: Commit** `feat(loom): rebuild Family to cosmic-tree mockup` + trailer.

---

### Task 4: Composer — `src/pages/Compose.tsx` → `cosmic-composer.png`

**Files:** Modify `cloudflare/frontend/src/pages/Compose.tsx` (1671 lines — re-skin the main editor view only; do not touch the delivery/draft/AI logic).

**Mockup target:** eyebrow `THE COMPOSER`; large left-aligned serif title `WRITE`; a `TO ___` underlined inline field (placeholder `e.g. Grandpa`) bound to the existing recipient state; a large italic body field placeholder `Share a family memory…`; a bottom meta row of inline labelled controls `WHEN · DYE · EMOTION` mapped to existing date/dye/emotion controls; a centered warm-outline `WEAVE` submit button.

**Preserve:** every `useMutation`/`useQuery`/`aiApi.suggestEmotion`/draft persistence (`draft0`, `recipientId`, `recipientName`, `deliveryTrigger`, `scheduledDate`), `usePageMeta`, `useQueryClient`, `useAuthStore`, `useNavigate`, `useSearchParams`. The "one composer, choose delivery" model stays — only restyle.

- [ ] **Step 1:** Read `cosmic-composer.png` + the composer's main render section of `Compose.tsx`.
- [ ] **Step 2:** Restyle the editor header to `CosmicHeader eyebrow="THE COMPOSER" title="WRITE" align="left"`; convert recipient + body inputs to the underlined/italic mockup styling; group the existing when/dye/emotion controls into the bottom meta row; restyle the submit button as warm-outline `WEAVE` (keep its existing onClick/mutation).
- [ ] **Step 3:** Do not alter delivery-trigger logic, scheduled-date logic, or AI suggestion calls.
- [ ] **Step 4: Build gate** → exit 0.
- [ ] **Step 5: Validate** montage compose↔cosmic-composer.
- [ ] **Step 6: Preserve-check** `grep -nE "aiApi.suggestEmotion|deliveryTrigger|scheduledDate|recipientId|useMutation" src/pages/Compose.tsx` all present.
- [ ] **Step 7: Commit** `feat(loom): rebuild Composer to cosmic-composer mockup` + trailer.

---

### Task 5: Settings — `src/pages/Settings.tsx` → `cosmic-settings.png`

**Files:** Modify `cloudflare/frontend/src/pages/Settings.tsx`

**Mockup target:** eyebrow `SETTINGS`; centered serif title `Settings`; four large rows — `Account` / `Notifications` / `Theme` / `Privacy` — each a serif label left with a mono metadata value right (`USER_ID: …`, `ENABLED: PUSH, EMAIL`, `CURRENT: DARK MODE`, `LAST REVIEW: …`), thin `--rule` dividers; warm centered `Sign out` at the bottom. Each row expands/links to its existing settings section.

**Preserve:** `settingsApi.getProfile`, profile form state (`firstName`/`lastName`/`birthDate`/`gender`), `useMutation` saves, check-in logic, `logout`, `useAuthStore`, `usePageMeta`, theme toggle.

- [ ] **Step 1:** Read `cosmic-settings.png` + current `Settings.tsx`.
- [ ] **Step 2:** Add the cosmic header + four summary rows (label + mono meta) that route/expand to the existing sections; wire `Sign out` to existing `logout`. Keep all existing forms reachable.
- [ ] **Step 3: Build gate** → exit 0.
- [ ] **Step 4: Validate** montage settings↔cosmic-settings.
- [ ] **Step 5: Preserve-check** `grep -nE "settingsApi.getProfile|logout|useMutation|usePageMeta" src/pages/Settings.tsx` all present.
- [ ] **Step 6: Commit** `feat(loom): rebuild Settings to cosmic-settings mockup` + trailer.

---

### Task 6: Voice — `src/pages/VoiceRoom.tsx` → `cosmic-voice.png`

**Files:** Modify `cloudflare/frontend/src/pages/VoiceRoom.tsx`

**Mockup target:** eyebrow `SPEAK IT`; a warm waveform across the top; a `0:42` mono timecode; a single warm circular play/stop control; a serif `WHAT YOU SAID` heading; the transcript as serif body prose; a mono `FIND BETTER WORDS` link at the bottom. (Single-recording detail view styling; the list of recordings stays accessible.)

**Preserve:** `voiceApi.getAll`, `voiceApi.delete` mutation, all playback state (`playingId`/`currentTime`/`audioDuration`), edit state (`editingId`/`editTitle`/`editDesc`), `useQueryClient`, `useSearchParams`, `useAuthStore`.

- [ ] **Step 1:** Read `cosmic-voice.png` + current `VoiceRoom.tsx`.
- [ ] **Step 2:** Restyle the waveform/timecode/transcript block to the mockup; keep the existing `<audio>` playback wiring and delete/edit affordances.
- [ ] **Step 3: Build gate** → exit 0.
- [ ] **Step 4: Validate** montage voice↔cosmic-voice.
- [ ] **Step 5: Preserve-check** `grep -nE "voiceApi.getAll|voiceApi.delete|playingId|audioDuration" src/pages/VoiceRoom.tsx` all present.
- [ ] **Step 6: Commit** `feat(loom): rebuild Voice to cosmic-voice mockup` + trailer.

---

### Task 7: Reading — `src/pages/ReadingRoom.tsx` → `cosmic-reading.png`

**Files:** Modify `cloudflare/frontend/src/pages/ReadingRoom.tsx` (965 lines — restyle the single-entry reading view).

**Mockup target:** mono eyebrow line `DATE · WOVEN BY <author>`; very large Source-Serif entry title; justified serif body prose with generous measure; a `∞` `WaxSeal` bottom-left. Pure type-forward, dark, no chrome.

**Preserve:** entry fetch + `revisions` logic, `useMutation`/`useQueryClient`, `active`/`view`/`navOpen`/`selvedgeOpen`/`deleteConfirm` state, `useSearchParams`, `useAuthStore`, wall↔book toggle, delete/revision affordances.

- [ ] **Step 1:** Read `cosmic-reading.png` + the reading-view render section of `ReadingRoom.tsx`.
- [ ] **Step 2:** Restyle the active-entry view to the mockup typography (eyebrow meta + huge serif title + justified body + wax seal). Keep navigation/wall/book/revision controls present (can be tucked into the existing nav drawer).
- [ ] **Step 3: Build gate** → exit 0.
- [ ] **Step 4: Validate** add `read` to the harness route list if needed; montage read↔cosmic-reading.
- [ ] **Step 5: Preserve-check** `grep -nE "revisions|useMutation|deleteConfirm|view" src/pages/ReadingRoom.tsx` all present.
- [ ] **Step 6: Commit** `feat(loom): rebuild Reading to cosmic-reading mockup` + trailer.

---

### Task 8: Inbox — `src/pages/Inbox.tsx` → `cosmic-inbox.png`

**Files:** Modify `cloudflare/frontend/src/pages/Inbox.tsx`

**Mockup target:** eyebrow `THE INBOX`; centered serif title `Inbox`; list rows — `[warm dot, filled if unread/sealed] [serif title] [small serif/sans description]` left, `[mono date]` right; thin `--rule` dividers. Drive from the three existing queries (upcoming unlocks / recent unlocks / received).

**Preserve:** `threadsApi.upcomingUnlocks`, `threadsApi.recentUnlocks`, received query, all `useQuery` blocks, any row linking for resolved unlocks.

- [ ] **Step 1:** Read `cosmic-inbox.png` + current `Inbox.tsx`.
- [ ] **Step 2:** Render `CosmicHeader eyebrow="THE INBOX" title="Inbox"` then `EntryRow` per item (filled dot for sealed/unread, hollow for opened) with date meta; preserve the upcoming/recent/received groupings (use `SectionLabel` if the mockup-equivalent grouping helps).
- [ ] **Step 3: Build gate** → exit 0.
- [ ] **Step 4: Validate** add `inbox` to harness routes; montage inbox↔cosmic-inbox.
- [ ] **Step 5: Preserve-check** `grep -nE "upcomingUnlocks|recentUnlocks|received|useQuery" src/pages/Inbox.tsx` all present.
- [ ] **Step 6: Commit** `feat(loom): rebuild Inbox to cosmic-inbox mockup` + trailer.

---

### Task 9: Search — `src/pages/SearchPage.tsx` → `cosmic-search.png`

**Files:** Modify `cloudflare/frontend/src/pages/SearchPage.tsx` (already close — align only)

**Mockup target:** serif title `SEARCH the family archive.` top-left; mono `SEARCH THE THREAD` input placeholder; results grouped by `MEMORIES` / `LETTERS` / `VOICES` (`SectionLabel`), each row `[warm dot] [serif title]` left, `[mono date]` right.

**Preserve:** `searchApi.search`, `query`/`input`/`typeFilter` state, `keepPreviousData`, debounce `useEffect`.

- [ ] **Step 1:** Read `cosmic-search.png` + current `SearchPage.tsx`.
- [ ] **Step 2:** Adopt `CosmicHeader` (left-aligned), the mono placeholder, `SectionLabel` groups, and `EntryRow` styling. Keep the type filter wired (the groups can also act as filters).
- [ ] **Step 3: Build gate** → exit 0.
- [ ] **Step 4: Validate** montage search↔cosmic-search.
- [ ] **Step 5: Preserve-check** `grep -nE "searchApi.search|keepPreviousData|typeFilter" src/pages/SearchPage.tsx` all present.
- [ ] **Step 6: Commit** `feat(loom): align Search to cosmic-search mockup` + trailer.

---

### Task 10: Full validation + ship

**Files:** none (verification + merge); bump `cloudflare/frontend/public/sw.js` CACHE.

- [ ] **Step 1: Full build gate** — `cd cloudflare/frontend && npm run build` → exit 0.
- [ ] **Step 2: Full montage** — `node scripts/mock-authed-shots.mjs && node scripts/montage-b64.mjs`; open `CONTACT-authed.png`; confirm every screen matches its mockup (header pattern, warm dots, serif titles, wax seals, layout).
- [ ] **Step 3: Functional audit** — diff the branch vs `main` and confirm zero data-layer regressions:
  Run: `git diff main --stat` and review; run preserve-greps from each task; confirm Pricing still shows `$6.99`/`$249` (untouched), and no ciphertext exposed pre-unseal.
- [ ] **Step 4: Bump SW cache** — in `cloudflare/frontend/public/sw.js` change `const CACHE = 'heirloom-v100'` → `'heirloom-v101'` (forces PWA shell refresh on deploy). Commit.
- [ ] **Step 5: Merge to main** (single clean deploy):
```bash
cd /Users/reshigan/Heirloom && git checkout main && git merge --no-ff redesign/inapp-mockup-match
git push origin main
```
- [ ] **Step 6: Live smoke** — after the `deploy-cloudflare.yml` run succeeds, cold-cache playwright the live authed-ish + public routes; confirm new bundle hash and that screens render the cosmic mockup layouts.

---

## Self-Review

**Spec coverage:** All 9 diverging in-app screens from the contact-sheet audit (Home, Thread, Family, Composer, Settings, Voice, Reading, Inbox, Search) each have a task; shared primitives in Task 0; ship/validate in Task 10. ✅
**Placeholder scan:** Each task names exact file, exact mockup, exact preserve-greps, exact build/validate commands. Layout targets are described by concrete mockup elements (not "make it nice"). CosmicUI ships as complete code. ✅
**Type/name consistency:** Primitives `CosmicHeader`/`WarmDot`/`EntryRow`/`SectionLabel`/`WaxSeal` referenced identically across Tasks 1–9. Harness scripts `mock-authed-shots.mjs`/`montage-b64.mjs` referenced consistently (Task 0 may need to extend the route list to include `read`/`inbox` — noted in Tasks 7/8). ✅
**Risk note:** Compose (1671) and ReadingRoom (965) are the highest-risk re-skins — restyle the render layer only, never the data/delivery/revision logic; preserve-greps guard this.
