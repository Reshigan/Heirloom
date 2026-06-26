# The Deep — Capture Cockpit + Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Consolidate 7 capture routes into one voice-first `/capture` cockpit, collapse the scrolling memories ledger into a paged reader, simplify nav 5→4, reconcile cloth→Deep vocabulary, and lift reader contrast — without renaming any route or component.

**Architecture:** Frontend-heavy React/Vite/TS change in `cloudflare/frontend`; one additive worker pagination endpoint. Reuses shipped parts (`Compose` seal ritual, `Record` transcribe pipeline, `ReadingRoom` pager). No backend store merge. ∞ and all `/loom/*` routes stay.

**Tech Stack:** React 18, Vite, TypeScript (strict), Tailwind, Zustand, Cloudflare Workers + D1.

**Gate after every phase:** `cd cloudflare/frontend && npm run build` (tsc && vite build, must be 0 errors). Worker changes also gate `cd cloudflare/worker && npx tsc --noEmit`.

**Correction vs spec:** `Frame.tsx` deletion is DROPPED this round — the file exports `UserMenu`/`TapestryEdge` consumed by ~8 pages; the `<Frame>` shell wrapper is only marginal IA cleanup. Defer to a later spec. Everything else stands.

---

### Task 1: Vocabulary reconcile + contrast/tap-target lift (lowest risk)

**Files:**
- Modify: `cloudflare/frontend/src/pages/Compose.tsx` (the "weave it in →" CTA)
- Modify: `cloudflare/frontend/src/pages/Family.tsx`, `src/pages/PhotoQuick.tsx` ("weave into cloth →")
- Modify: `cloudflare/frontend/src/loom/components/InfinityMenu.tsx` ("the cloth" copy)
- Modify: `cloudflare/frontend/src/pages/HelpSupport.tsx`, `src/pages/Marketing.tsx`
- Modify: `cloudflare/frontend/src/styles/globals.css` (`--bone-faint` dark lift; remove `.dye-veil/.dye-glass/.dye-chip`)
- Modify: `cloudflare/frontend/src/pages/Memories.tsx` (edit/unweave tap targets)
- Modify: `ART_DIRECTION.md`, `CLAUDE.md` (Deep constitution)

- [ ] **Step 1: Verbs.** In `Compose.tsx` change the seal CTA text `weave it in →` → `let it settle →`. In `Family.tsx` and `PhotoQuick.tsx` change `weave into cloth →` → `lower into the Deep →` and any `weaving…` loading text → `settling…`. In `Marketing.tsx` change `weave it in` → `it settles` in the "sealed the moment…" line. In `HelpSupport.tsx` change `weave it into the cloth` → `lower it into the Deep`. (grep each file for the literal first.)
- [ ] **Step 2: ∞ menu copy.** In `InfinityMenu.tsx` change "the cloth, to keep" → "the Deep, to keep"; aria "the cloth's artifacts" → "what the Deep holds".
- [ ] **Step 3: Contrast.** In `globals.css` raise dark `--bone-faint` from `rgba(242,230,208,0.52)` to `rgba(242,230,208,0.62)` (lifts ~4.8→~5.6:1). Leave light/parchment forks unchanged.
- [ ] **Step 4: Glass orphans.** Remove the `.dye-veil`/`.dye-glass`/`.dye-chip` rule blocks + their `--dye-*` custom props from `globals.css` (verified zero tsx consumers). Keep the `.dye-veil` *light* fallback only if it has a consumer — re-grep; it does not, remove all.
- [ ] **Step 5: Tap targets.** In `Memories.tsx`, the 6 mono control buttons (`fontSize: 10`, edit/unweave/clear/etc.) get `minHeight: 44, display: 'inline-flex', alignItems: 'center'` added to their inline style, keeping the lifted `--bone-faint`.
- [ ] **Step 6: Docs.** Rewrite the brand sections of `ART_DIRECTION.md` and `CLAUDE.md` to The Deep: ground `#070d14`, fonts Fraunces/Source Serif 4/JetBrains Mono, canonical vocabulary `the Cloth → the Deep`, verb `let it settle`, ∞ kept as the only mark, note `/loom/*` routes are internal and not renamed.
- [ ] **Step 7: Gate + commit.** `cd cloudflare/frontend && npm run build` → 0 errors. Bump `public/sw.js` CACHE version. Commit `feat(the-deep): cloth→Deep vocabulary, AA contrast lift, kill glass orphans`.

---

### Task 2: Nav 5 → 4 with center Capture

**Files:**
- Modify: `cloudflare/frontend/src/loom/components/BottomNav.tsx:21-27` (NAV array + header doc)

- [ ] **Step 1: NAV array.** Replace the 5-item `NAV` with 4:
```ts
const NAV = [
  { label: 'the deep', href: '/loom/weft' },
  { label: 'capture',  href: '/capture', center: true },
  { label: 'family',   href: '/family' },
  { label: 'you',      href: '/loom/profile' },
] as const;
```
- [ ] **Step 2: Center semantics.** Update the center-active match: `isCenter` now matches `/capture` (was `/loom/index`). The center stays the warm anchor. Update the header doc comment (5 destinations → 4; `cloth·memory·home·voice·profile` → `the deep·capture·family·you`) and the `aria-label` for the center from `Home` → `Capture`.
- [ ] **Step 3: Hide list.** Add `/capture` is an app surface (do NOT hide). Leave `HIDE_PREFIXES` as-is.
- [ ] **Step 4: Gate + commit.** `npm run build` → 0 errors (note: `/capture` route lands in Task 3; nav link will 404 until then — acceptable mid-branch, but sequence Task 3 before deploy). Commit `feat(the-deep): bottom nav 5→4, center = capture`.

---

### Task 3: `/capture` cockpit (the core new surface)

**Files:**
- Create: `cloudflare/frontend/src/pages/Capture.tsx`
- Modify: `cloudflare/frontend/src/App.tsx` (lazy route, protected)
- Reference (read, reuse patterns): `src/pages/Record.tsx:159-224` (MediaRecorder + `aiApi.transcribe`), `src/pages/Compose.tsx` (seal ritual ~1245-1325, `addImages` 1061-1096, `isLetter` :997, `memoriesApi.create` :1173, `lettersApi` :1133, `WeaveCeremony`)

- [ ] **Step 1: Route.** In `App.tsx`, add `const Capture = lazy(() => import('./pages/Capture'));` and a protected route `<Route path="/capture" element={<Capture/>} />` alongside the other authed routes (match the existing lazy + guard idiom).
- [ ] **Step 2: Shell.** Build `Capture.tsx` on `ClothShell` (topbar title "Capture", breadcrumb root `the deep → /loom/weft`). Local state `mode: 'voice' | 'photo' | 'write'` defaulting `'voice'`. Body uses Source Serif; labels JetBrains Mono.
- [ ] **Step 3: Voice mode.** Port the `MediaRecorder` start/stop + `recorder.onstop → aiApi.transcribe({audioUrl})` flow from `Record.tsx`. Record affordance = a warm copper hairline ring button (no icon, no ∞, no logo), `aria-label="Record a voice memory"`, `minHeight/minWidth ≥ 64`. On transcript, show it in an editable `<textarea aria-label="Memory content">`.
- [ ] **Step 4: After-voice choices.** Three mono actions: `keep as voice` (→ `voiceApi.create`, which mirrors into the default thread), `add a picture` (→ reuse `addImages` file input, switches to attach state), and the implicit text path (transcript already in the body). On transcription error, inline status "couldn't transcribe — keep as voice or try again" (no toast); recording preserved.
- [ ] **Step 5: Photo + write modes.** `write instead` toggle → focuses the textarea (keyboard up), mode `'write'`. `add a picture` from idle → file input, mode `'photo'`, optional caption field. Both save as Memory.
- [ ] **Step 6: Recipient + sink.** One optional field `to: (someone in your bloodline)` (`aria-label="Recipient (optional)"`). Compute `isLetter = !!(recipientId || recipientName.trim())` (copy the predicate from `Compose.tsx:997`). Empty → `memoriesApi.create`; filled → `lettersApi` path. `metadata` only carries whitelisted keys (`entryDate`, `dye`, `images`) — anything else is dropped by the worker.
- [ ] **Step 7: Commit gesture + land.** Press-and-hold Seal (720ms) reusing Compose's ritual + `WeaveCeremony`; CTA copy `let it settle →`. Success → `navigate('/loom/weft')`.
- [ ] **Step 8: Onboarding wiring.** In `Onboarding.tsx`, route the first-entry step through `/capture` (or reuse its save call) so the first entry is a Memory and the flow ends on `/loom/weft`, not `/loom/pwa`. (Minimal: change the onboarding "begin" CTA target + post-save nav.)
- [ ] **Step 9: Gate + commit.** `npm run build` → 0 errors. Bump `public/sw.js` CACHE. Commit `feat(the-deep): /capture voice-first cockpit, memory default`.

---

### Task 4: PagedReader primitive + DecadePlane (the read collapse)

**Files:**
- Create: `cloudflare/frontend/src/loom/components/PagedReader.tsx` (extract from `ReadingRoom.tsx`)
- Modify: `cloudflare/frontend/src/pages/ReadingRoom.tsx` (consume `PagedReader`, no behavior change)
- Create: `cloudflare/frontend/src/pages/DecadeReader.tsx` (DecadePlane landing) OR fold into the home read action
- Modify: ledger routes' "read" action to open the reader

- [ ] **Step 1: Extract.** Pull `ReadingRoom`'s nav shell (prev/later, `PagerCounter` dot→`07 / 142` collapse at `DOT_CAP=12`, keyboard ←/→, per-page scroll reset, jump drawer) into `PagedReader.tsx` with the props interface from the spec (`pages`, `index`, `onIndex`, `dye?`, `renderPage`, `jumpLabel?`). No data fetching inside.
- [ ] **Step 2: Refactor ReadingRoom onto it.** `ReadingRoom` now renders `<PagedReader>` with its entry pages. Verify identical behavior on prod-like build (manual: arrows, counter collapse, jump drawer).
- [ ] **Step 3: decadeOf helper.** Consolidate the decade-grouping logic (currently duplicated in `LoomIndex`/`Weft`/`Memories`) into one `src/loom/decades.ts` `decadeOf(date): number` + `groupByDecade(entries)`.
- [ ] **Step 4: DecadePlane.** Build the decade landing: one screen per decade (Fraunces title "The 1980s", year-span, dyes present, the decade's `EntryRow` list) rendered through `PagedReader`. Tapping a row opens the EntryPlane (ReadingRoom) scoped to that decade. Sparse: `total <= 1` skips the decade plane and opens the entry directly.
- [ ] **Step 5: Wire the home read action** (`/loom/weft` "read the thread") to open the DecadePlane; point `/memories`,`/loom/index` "read" actions at it too. Leave the old ledger routes resolving (files on disk) but route their primary read CTA into the new reader.
- [ ] **Step 6: Gate + commit.** `npm run build` → 0 errors. Bump `public/sw.js`. Commit `feat(the-deep): PagedReader + decade reader, collapse ledgers`.

---

### Task 5: Server-side pagination (the one new backend piece)

**Files:**
- Modify: `cloudflare/worker/src/routes/memories.ts` (list endpoint: cursor)
- Modify: matching letters/voice list endpoints if the DecadePlane fetches them
- Modify: `cloudflare/frontend/src/lib/api*.ts` callers to pass `before`/`limit`

- [ ] **Step 1: Worker.** Add `?before=<created_at>&limit=<n>` (default 100, max 200) to the memories list query: `... WHERE user_id=? AND deleted_at IS NULL AND (?2 IS NULL OR created_at < ?2) ORDER BY created_at DESC LIMIT ?3`. Return `{ items, nextBefore }`. Keep `readDescription` decrypt on read; keep `redactSealedEntry` server-side.
- [ ] **Step 2: Typecheck.** `cd cloudflare/worker && npx tsc --noEmit` → 0 errors.
- [ ] **Step 3: Frontend.** DecadePlane fetches per-decade / pages via `nextBefore`. Remove the `limit: 200/500` hard caps in the ledger callers.
- [ ] **Step 4: Gate + commit.** Frontend `npm run build` + worker typecheck both 0. Commit `feat(the-deep): server-side pagination for archive scale`.

---

### Final: deploy + prod test

- [ ] Push branch → merge to `main` (deploy via `deploy-cloudflare.yml` + worker job). Smoke the LIVE site (CSP/inline-script rule applies).
- [ ] Prod Playwright lifetime E2E (from `cloudflare/frontend`, swiftshader chromium args, theme pinned `vault`): signup → `/capture` voice→text→seal → assert Memory on the Deep → capture a Letter (recipient set) → assert routed to recipient not home → page DecadePlane→EntryPlane with arrows → confirm 4-item nav. Minimize signups (each is a real prod account).

## Self-review notes
- **Spec coverage:** A=Task3, B=Task2, C=Task1(contrast)+Task4(reader)+Task5(pagination), D=Task1(vocab). Frame deletion intentionally dropped (documented).
- **Type consistency:** `isLetter` predicate copied verbatim from `Compose.tsx:997`; `PagedReader` props match spec; `decadeOf` single source.
- **Risk order:** 1 (cosmetic) → 2 (nav) → 3 (new page) → 4 (read refactor) → 5 (backend). Each build-gated + committed; deploy only after all green.
