# Repo cleanup + debug — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, this session — user requested continuous execution to go-live). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Delete retired code, sweep dead code, make all gates green, fix known issues, pass Playwright + runtime smoke, ship each tier to heirloom.blue.

**Architecture:** Risk-tiered incremental — 4 tiers, each a commit + deploy + live smoke. Cleanup task (no new features), so the "test" is the typecheck/build gate + live smoke, not unit tests.

**Tech Stack:** React 18 + Vite + TS (frontend), Hono + Workers + D1 (worker), Capacitor (mobile), tsx + Anthropic SDK (marketing).

---

## File map (verified 2026-06-28)

### Tier 1 — retired-code purge

**Frontend (cloudflare/frontend/src):**
- Delete: `pages/Streaks.tsx` (only live importer is itself)
- Delete: `pages/Referrals.tsx` (only live importer is itself)
- Modify: `services/api.ts` — remove `streaksApi` block (~567-571) + `familyReferralsApi` block (~582-590). KEEP `challengesApi` (live, Challenges.tsx) + `giftSubscriptionsApi` + `referralApi` (hits /marketing/referral/code, live).
- Modify: `App.tsx` — remove Streaks/Referrals comments (lines 65-66, 546) if present; verify no route imports exist (none do).

**Worker (cloudflare/worker/src):**
- Modify: `routes/q4-features.ts` — delete `streaksRoutes` export + handlers (lines ~15-140: GET `/`, POST `/activity`, POST `/freeze`). KEEP `challengesRoutes` (live). Delete `referralsRoutes` export + handlers. Remove the internal `fetch('/streaks/activity')` call in challenges submit handler (~line 224-228) — replace with nothing (streaks retired).
- Modify: `index.ts` — remove `streaksRoutes` + `referralsRoutes` from q4-features import (line 37); remove `protectedApp.route('/streaks', streaksRoutes)` (886) + `protectedApp.route('/referrals', referralsRoutes)` (888); remove `import { referralRoutes } from './routes/referrals'` (40) + `app.route('/api/referral', referralRoutes)` (322).
- Delete: `routes/referrals.ts` (referralRoutes, /api/referral — zero frontend callers).
- Modify: `routes/engagement.ts` — remove `/streaks` GET handler (line 20) + `/activity` POST handler (line 56) + their helpers. KEEP all invite/card/dates/email-preferences endpoints (live). Verify line ranges before delete.

**Marketing/scripts:** grep for streak/referral refs — expected none.

### Tier 2 — aggressive dead-code sweep
- ts-prune / grep unreferenced-file hunt across frontend + worker.
- Delete unreferenced whole files (reviewed per-file).
- Strip clearly-dead unused exports within live files (per-file review).
- Remove stale design refs if unreferenced by live code: `STITCH_BRIEF.md`, `Heirloom_Design.html` (user has open — confirm), `NewUI/`, `design-refs/`.
- Gates + deploy + smoke.

### Tier 3 — gate fixes + known issues
- tsc/build all 4 subsystems. Fix every error/warning.
- Known issues: voice replay-dup, held-while-IDB-down, bounce-webhook follow-up, notif-prompt gating.
- Gates + deploy + smoke.

### Tier 4 — Playwright + runtime smoke + bug hunt
- Run prod Playwright suite. Fix failures.
- Runtime smoke: signup (?tier=free), capture→memory write, letters send (result.success gate), voice record/queue, billing redirect.
- Fix bugs. Deploy. Final smoke.

---

## Tier 1 tasks

### Task 1.1: Delete frontend retired pages + api blocks

**Files:**
- Delete: `cloudflare/frontend/src/pages/Streaks.tsx`
- Delete: `cloudflare/frontend/src/pages/Referrals.tsx`
- Modify: `cloudflare/frontend/src/services/api.ts` (~567-590)
- Modify: `cloudflare/frontend/src/App.tsx` (comments ~65-66, 546)

- [ ] Step 1: Delete `pages/Streaks.tsx` + `pages/Referrals.tsx`
- [ ] Step 2: Edit `services/api.ts` — remove `streaksApi` block (5 lines) + `familyReferralsApi` block (~8 lines). Keep challengesApi/giftSubscriptionsApi/referralApi.
- [ ] Step 3: Edit `App.tsx` — remove the 2 retired comments if present. Verify no Streaks/Referrals route imports (grep confirms none).
- [ ] Step 4: Verify no dangling importers: `grep -rnE "streaksApi|familyReferralsApi|pages/Streaks|pages/Referrals" cloudflare/frontend/src` → only comments/empty.

### Task 1.2: Delete worker retired routes

**Files:**
- Modify: `cloudflare/worker/src/routes/q4-features.ts`
- Modify: `cloudflare/worker/src/index.ts` (lines 37, 40, 322, 886, 888)
- Delete: `cloudflare/worker/src/routes/referrals.ts`
- Modify: `cloudflare/worker/src/routes/engagement.ts` (streaks GET ~20, activity POST ~56)

- [ ] Step 1: `routes/q4-features.ts` — delete `streaksRoutes` const + all its handlers (GET `/`, POST `/activity`, POST `/freeze`). Delete `referralsRoutes` const + handlers. Remove the internal `fetch(.../streaks/activity...)` block in challenges submit handler (~224-228).
- [ ] Step 2: `index.ts` — update q4-features import to drop `streaksRoutes, referralsRoutes`; remove the 2 `protectedApp.route` lines (886, 888); remove `referralRoutes` import (40) + `app.route('/api/referral', referralRoutes)` (322).
- [ ] Step 3: Delete `routes/referrals.ts`.
- [ ] Step 4: `routes/engagement.ts` — delete `/streaks` GET handler + `/activity` POST handler + helpers. Keep all other engagement endpoints.
- [ ] Step 5: Verify no dangling refs: `grep -rnE "streaksRoutes|referralsRoutes|referralRoutes|/streaks/activity|/api/referral" cloudflare/worker/src` → empty.

### Task 1.3: Gates + deploy + smoke

- [ ] Step 1: `cd cloudflare/frontend && npm run build` → 0 errors.
- [ ] Step 2: `cd cloudflare/worker && npx tsc --noEmit` → 0 errors.
- [ ] Step 3: Bump SW `CACHE` in `cloudflare/frontend/public/sw.js` (e.g. v205-deep → v206-deep).
- [ ] Step 4: Commit: `chore(retired): hard-delete streaks + referrals (pages, api, worker routes)`.
- [ ] Step 5: Push → triggers deploy. Wait for green (gh run list).
- [ ] Step 6: Smoke live: `curl heirloom.blue/sw.js` (v206), `curl api.heirloom.blue/api/health` (readiness all-green), home/begin 200, `/streaks` + `/referrals` + `/api/referral` not 500.

## Tier 2/3/4 tasks
Defined inline at execution (depend on Tier 1 results + ts-prune output). Same shape: edit → gate → bump SW → commit → push → smoke.

---

## Self-review

- Spec coverage: Tier 1 = retired purge ✓. Tier 2 = aggressive sweep ✓. Tier 3 = gates + known issues ✓. Tier 4 = Playwright + smoke ✓. All 4 subsystems covered (mobile/marketing in Tier 3 gates).
- No placeholders: file paths + line numbers are verified from disk, not graph snapshots. Tier 2-4 task bodies deferred because they depend on Tier 1 output (ts-prune) — noted explicitly, not stubbed.
- Consistency: `familyReferralsApi` (not `referralsApi`) — verified name. `referralApi` (keep) vs `familyReferralsApi` (delete) vs `referralRoutes` (delete) vs `referralsRoutes` (delete) — disambiguated.
- Scope: 4 tiers, each independently shippable. Good.