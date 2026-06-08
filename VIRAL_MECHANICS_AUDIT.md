# Viral Mechanics Audit — Heirloom
_Audited: 2026-06-07_

---

## Infrastructure baseline

| Asset | Status |
|---|---|
| OG images | 4 files exist: `entry.png`, `inherit.png`, `milestone.png`, `wrapped.png` |
| Pages Functions (OG injection) | `inherit/[[path]].ts` ✅, `wrapped/[[path]].ts` ✅ — no functions for `/card/*`, `/entry/*`, `/milestone/*` |
| `share-meta.ts` (worker lib) | Exists, pure, unit-tested. Handles `ShareKind`: `thread | inherit | wrapped | milestone | entry` |
| Worker routes | `wrapped.ts` ✅, `referrals.ts` ✅, `inherit.ts` ✅, `memory-cards.ts` ✅ |

---

## Loop-by-loop status

---

### 1. Inherit (Vault Unlock) ⚠️ PARTIAL

**What exists:**
- `cloudflare/worker/src/routes/inherit.ts` — full token validation, session creation, recipient data returned.
- `cloudflare/frontend/functions/inherit/[[path]].ts` — OG injection (`/og/inherit.png`) for crawlers on `/inherit/*`.
- `cloudflare/frontend/src/pages/InheritanceCard.tsx` — recipient landing page at `/inheritance/:token`. Fetches owner + recipient info, shows "∞ open the thread" button. After click, reveals: _"The thread is open. Create your account to read and contribute."_ with a `<Link to="/signup">Join the thread →</Link>`.

**Gap:**
The CTA exists (`Join the thread →` → `/signup`) but carries no referral attribution. There is no `?ref=` or `?from=inherit` passed to signup, so the conversion is untracked. The recipient sees no explanation of what Heirloom is before being asked to create an account — the page jumps from "someone wrote to you" straight to a signup link with no social proof or narrative bridge.

**One-line fix:**
Change the signup link to `<Link to="/signup?from=inherit">Join the thread →</Link>` and add one sentence of context: _"Heirloom is a thread your family keeps forever."_

---

### 2. Invite-to-Contribute (Family + Referrals) ✅ COMPLETE

**What exists:**
- `cloudflare/frontend/src/pages/Family.tsx` — full email invite flow with `copyLink()` function, copy-to-clipboard, pending invites list, `lastInviteCode` state.
- `cloudflare/frontend/src/pages/Referrals.tsx` — separate referral dashboard at `/referrals`: personal invite link (`/signup?ref=CODE`), invite-by-email modal, milestone rewards (5/10/25/50 accepted → storage/discount/free month), family branch breakdown, all-invites list.
- `cloudflare/worker/src/routes/referrals.ts` — generates codes, tracks accepts, awards rewards.
- Routes wired in `App.tsx` at `/referrals`.

**Gap:**
`/referrals` has no entry point in the InfinityMenu or Settings page. A user who hasn't stumbled on it will never find it. `Family.tsx` has its own separate invite CTA that does not cross-link to the Referrals dashboard.

**One-line fix:**
Add `{ label: 'invite', to: '/referrals', hint: 'grow the bloodline' }` to `ITEMS` in `InfinityMenu.tsx`.

---

### 3. Year Wrapped ⚠️ PARTIAL

**What exists:**
- `cloudflare/frontend/src/pages/Wrapped.tsx` — page renders stats (entries this year, months active, total in thread, years running).
- `cloudflare/frontend/functions/wrapped/[[path]].ts` — OG injection on `/wrapped/*` with card: _"A year, added to a family thread."_
- `InfinityMenu.tsx` — "wrapped" item links to `/wrapped`. It is discoverable.
- Worker route `wrapped.ts` — full year data generation and caching.

**Gap:**
`Wrapped.tsx` renders the text `share this year's thread →` as a static `<p>` with no `onClick`, no `navigator.share()` call, no copy-link button. There is zero share mechanic on the page despite the OG infrastructure being fully wired. The page also uses `memoriesApi.getAll()` instead of the dedicated `/wrapped/current` worker endpoint, so it skips streak, top emotions, highlights, and summary data.

**One-line fix:**
Add `<button onClick={() => navigator.share({ title: 'My year on Heirloom', url: window.location.href })} ...>share this year's thread →</button>` replacing the static `<p>` in `Wrapped.tsx`. Separately, switch the query to hit `/api/wrapped/current`.

---

### 4. Milestone Share ❌ MISSING

**What exists:**
- OG image `milestone.png` exists in `/public/og/`.
- `share-meta.ts` defines `milestone` as a `ShareKind` with `count` parameter.
- `Compose.tsx` and `ComposeLetter.tsx` have a `milestone` delivery trigger (a different concept — milestone-gated letter delivery, not a share prompt).

**Gap:**
There is no in-app trigger that detects a milestone entry count (e.g., 10th, 50th, 100th memory) and surfaces a share prompt. No Pages Function exists for a `/milestone/*` route to inject OG. The `entryCount` value is fetched and displayed in `Frame.tsx` but never compared against any threshold. There is no share button on the Milestones page (`Milestones.tsx` only uses "share" as a placeholder text field).

**One-line fix (trigger):**
In `Frame.tsx`, after `const entryCount = useEntryCount()`, add: `useEffect(() => { if (entryCount && [10, 50, 100, 500].includes(entryCount)) setShowMilestoneShare(true); }, [entryCount]);` and render a dismissible inline prompt that links to `/wrapped` with a pre-filled share.

**Full gap (OG):**
Also create `cloudflare/frontend/functions/milestone/[[path]].ts` mirroring the `inherit` and `wrapped` functions to inject `milestone.png` when `/milestone/*` links are shared.

---

### 5. Single-Entry Sharing ⚠️ PARTIAL

**What exists:**
- `cloudflare/worker/src/routes/memory-cards.ts` — generates styled memory cards, returns `shareUrl: https://heirloom.blue/card/:id` plus pre-built Twitter/Facebook/LinkedIn/WhatsApp share links.
- `cloudflare/frontend/src/pages/MemoryCards.tsx` — UI to generate cards, copy `shareUrl` to clipboard, open `card.shareUrl` as an `<a href>`.
- `cloudflare/frontend/src/pages/CardView.tsx` — public landing at `/card/:id`, uses `navigator.share()` with `card.shareUrl`.
- `cloudflare/frontend/src/pages/Unlock.tsx` — after a sealed letter unlocks, a `<ShareCard>` component renders a portrait artifact card (year count between sealed and read, seal/open dates) with a share surface.
- `cloudflare/worker/src/routes/story-artifacts.ts` — generates story artifacts with `shareUrl: /story/:shareToken`.
- `cloudflare/frontend/src/pages/StoryArtifact.tsx` — shows share URL with copy-to-clipboard.
- `cloudflare/worker/src/routes/engagement.ts` — generates share tokens, returns `shareUrl: https://heirloom.blue/share/:shareToken`.

**Gap:**
No Pages Function exists for `/card/*`, `/story/*`, or `/share/*` paths, so those links unfurl with the generic homepage OG card (`entry.png` is never injected). The `entry.png` OG image has no associated injection function despite `share-meta.ts` defining the `entry` kind. There is also no direct share button on the main memory/weft composer post-submit flow (`Weft.tsx` has no share affordance after saving an entry).

**One-line fix (OG):**
Create `cloudflare/frontend/functions/card/[[path]].ts` identical to `inherit/[[path]].ts` but using `OG_CARDS.entry` (add that key to `_shared/og.ts` pointing at `/og/entry.png`).

---

## Summary table

| Loop | Status | Blocking gap |
|---|---|---|
| Inherit → recipient CTA | ⚠️ PARTIAL | CTA exists but untracked; no referral attribution on `/signup` |
| Invite-to-contribute | ✅ COMPLETE | Surface discovery only — `/referrals` not in any nav |
| Year Wrapped share | ⚠️ PARTIAL | `share this year's thread →` is dead text; no `navigator.share()` call |
| Milestone share | ❌ MISSING | No trigger, no Pages Function OG injection for `/milestone/*` |
| Single-entry (card/letter/story) | ⚠️ PARTIAL | No Pages Function OG injection for `/card/*`, `/story/*`, `/share/*` |

---

## Priority order

1. **Wrapped share button** — one `onClick` + `navigator.share()` call. Highest effort/impact ratio; infrastructure fully wired.
2. **Entry/card OG Pages Function** — 7-line file copied from `inherit/[[path]].ts`. Fixes every shared card link unfurling as the homepage.
3. **Referrals in InfinityMenu** — one array item. Makes the best-built viral loop discoverable.
4. **Inherit attribution** — add `?from=inherit` to signup link. Closes the conversion tracking gap.
5. **Milestone trigger** — new logic in `Frame.tsx` + new Pages Function. Highest complexity, but `milestone.png` and `share-meta.ts` already exist.
