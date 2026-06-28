# Repo cleanup + debug — design

Date: 2026-06-28
Status: approved (pending spec review)
Approach: risk-tiered incremental, 4 tiers, each tier = one commit + one deploy + live smoke.

## Goal

Across all 4 subsystems (cloudflare/frontend, cloudflare/worker, mobile, marketing+scripts):
delete retired code, sweep dead code, make all gates green, fix known open issues, run Playwright +
runtime smoke, ship each tier to heirloom.blue.

## Scope decisions (from user)

- **Subsystem breadth:** everything — frontend, worker, mobile, marketing/scripts. Ship in batches.
- **Retired code:** hard-delete. Recoverable via git history only.
- **Dead-code bar:** aggressive — named retired set + unused exports, unreferenced files, deprecated
  components, stale design refs (STITCH_BRIEF.md, Heirloom_Design.html, NewUI/, design-refs/). Reviewed
  per-file before delete; not bulk-symbol-stripped blind.
- **Debug bar:** gates (tsc/build/lint) + known issues + prod Playwright + runtime smoke of key flows.

## Named retired code (Tier 1 targets)

Graph-confirmed dormant nodes kept "for revival":

- Frontend: `pages/Streaks*`, `pages/Referrals*`, `loom/pages/echo*`, `services/api/streaksApi`,
  `services/api/familyReferralsApi`, any imports/routes in `App.tsx`, nav links.
- Worker: `routes/q4-features/streaksRoutes`, `routes/q4-features/newStreak`,
  `routes/q4-features/longestStreak`, `routes/engagement/newStreak`, `jobs/adoption-jobs/processStreakMaintenance`,
  `email-templates/familyReferralInviteEmail`, plus router registrations in `index.ts`.
- Marketing/scripts: drop references if any.

Exact file existence verified at execution time (graph is a snapshot); delete only what's present.

## Tier 1 — retired-code purge (pure deletion, zero behavior change)

Delete named retired code across frontend + worker + marketing. Remove imports/routes/nav.
Verify: `tsc --noEmit` (frontend + worker) + `npm run build` clean.
Bump SW `CACHE`. Commit. Deploy. Smoke live: `/api/health` readiness all-green, home/begin/key
routes 200, retired routes 404 (SPA fallback) not 500.

## Tier 2 — aggressive dead-code sweep

- ts-prune (or grep-based unreferenced-file hunt) across frontend + worker.
- Delete unreferenced whole files.
- Strip unused exports within live files only when clearly dead; reviewed per-file.
- Remove stale design refs: `STITCH_BRIEF.md`, `Heirloom_Design.html`, `NewUI/`, `design-refs/`
  if unreferenced by live code.
- Verify: gates clean. Bump SW. Commit. Deploy. Smoke.

## Tier 3 — gate fixes + known issues

- Run tsc/build across all 4 subsystems (frontend, worker, mobile, marketing). Fix every error +
  warning.
- Known open issues (from memory):
  - Voice replay-dup risk (legacy-bequest-offline-voice-dms-live).
  - Held-while-IDB-down voice risk.
  - Bounce-webhook follow-up (silent-delivery-bug-fixed — bounce webhook still open).
  - Notif-prompt gating (adoption-psychology-batch — notif-prompt gated on user).
- Verify each fix. Bump SW. Commit. Deploy. Smoke.

## Tier 4 — Playwright + runtime smoke + bug hunt

- Run prod Playwright suite (255 tests per go-live-e2e-gate-green). Fix any failures.
- Runtime smoke key flows: signup (?tier=free), capture → memory write via memoriesApi, letters
  send (verify result.success gate), voice record/queue (IndexedDB), billing redirect (Stripe).
- Fix found bugs. Bump SW. Commit. Deploy. Final smoke.

## Cross-cutting

- One commit + one deploy + live smoke per tier. SW `CACHE` bump every deploy (memory rule:
  browser byte-compares sw.js; unchanged = no update cycle = stale PWA).
- Rollback = `git revert` + redeploy per tier. No half-tier deploys.
- Mobile + marketing: tiers 1-3 apply (cleanup + gates). Tier 4 smoke is frontend + worker only
  (mobile = native shell; marketing = CI, not user-facing surface).
- Session-budget guard: if running long, stop at cleanest tier checkpoint, report. Never ship a
  half-tier.

## Verification gates per tier

- Frontend: `cd cloudflare/frontend && npm run build` (tsc && vite build).
- Worker: `cd cloudflare/worker && npx tsc --noEmit`.
- Mobile: `cd mobile && npx tsc --noEmit` (or build cmd — verify at execution).
- Marketing: `cd marketing/automation && npm run typecheck`.
- Live smoke: curl `heirloom.blue/sw.js` (version), `api.heirloom.blue/api/health` (readiness),
  home/begin/health 200, retired routes not 500.

## Out of scope

- New features. No behavior additions.
- Refactors that aren't deletion or bug-fix. "Improve code while in there" limited to files
  touched for deletion/bug reasons.
- Re-skin / design changes.
- Marketing content generation or posting.

## Risks

- Deleted dormant code may have a live importer missed by grep/ts-prune → build catches it.
  Mitigation: gate run before each deploy.
- Stale design-ref removal (Heirloom_Design.html) — user has it open in IDE. Confirm before
  delete if unsure; recoverable via git.
- Worker route deletion could break a live client call if route still referenced. Mitigation:
  gate + smoke + check worker logs after deploy.