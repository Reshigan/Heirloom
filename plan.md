# Heirloom — Global Launch Plan

Owner: autonomous engineering pass. Goal: get Heirloom launch-ready (tests green, UX polished to
the [ART_DIRECTION.md](ART_DIRECTION.md) cloth-theme constitution), the marketing engine verified,
12 weeks of content shipped, and zero-budget viral mechanics built. Status legend: ☐ todo · ◐ in progress · ☑ done.

---

## Phase 0 — Foundation (this pass)
- ☑ Repo reconnaissance (frontend/backend/marketing/cloudflare/mobile mapped)
- ☑ Baseline: frontend `tsc --noEmit` clean; backend has no tests; marketing engine exists
- ☑ `CLAUDE.md` (project memory) + `plan.md` (this file)

## Phase 1 — Launch-readiness test suite  *(launch-blocking)* — ☑ DONE
The backend had `test: vitest` wired but zero tests. A real safety net now exists.
- ☑ Added `backend/vitest.config.ts` + `src/test/setup.ts` (throwaway env; no DB hit; mock Prisma/Redis)
- ☑ Unit tests for highest-risk services: encryption (16), auth/token (9), billing/tier gating (6), env/pricing guardrails (6) — **37 green**
- ☑ Worker: added `share-meta` unit tests (22) → worker `vitest` now **40 green**; `tsc --noEmit` clean
- ☐ Route-contract tests for the critical API surface (deferred — needs a miniflare/D1 harness)
- ☐ Frontend Vitest + RTL on highest-value components (deferred; `npm run build`/tsc is the live gate)
- ☑ Marketing engine smoke: `npm run typecheck` green (preview is the dry-run path; never `daily`/`post`)
- ☑ Wired into `.github/workflows/pr-checks.yml`: `check-backend`, `check-marketing` (+ existing frontend/worker/migrations)
- **Done:** `backend npm test` 37/37, `worker vitest` 40/40, `frontend npm run build` exit 0, `marketing typecheck` exit 0.

## Phase 2 — UX evaluation & enhancement  *(design skills)* — ◐ AUDIT DONE, IMPL REMAINS
Applied emil-design-eng / frontend-design / taste / impeccable lenses against the §2 constitution.
- ☑ Audited the live `cloudflare/frontend` tree vs the brief → `UX_AUDIT.md`
- ☑ Verdict: live product ≈25% to brief; the demo/`loom` routes ≈70%. The five invariants are NOT
  yet built into the real authenticated product screens.
- ☑ Flagged debt: global nav + avatar circles, fire/wax-seal Unlock (§2.6 literal-metaphor violation),
  `lucide-react` icons (product should have none but `∞`), spinners (should be hairline bars)
- ☑ **P0-3 done:** replaced the fire/wax Unlock with the 720ms typographic dissolve (`loom/pages/Unlock.tsx`).
- ☑ **P0-5 done (component + canonical surfaces):** built `ui/ProgressHair` (1px hairline, reduced-motion safe);
  wired into Threads + ThreadDetail.
- ◐ **P0-4 partial:** `lucide-react` stripped from the two canonical Thread surfaces; 13 files remain.
- ☐ **REMAINS (large):** P0-1 nav/avatar → Eyebrow+TapestryEdge; P0-2 Tapestry home + persistent edge +
  append-only counter + Listener slot (§6.0); P0-4 rest (icon sweep); P0-5 rest (~65 spinners); P0-6
  glassmorphism; §2.7 dye palette inside cloth only. (Tracked in UX_AUDIT.md → "Implementation progress".)
- **Note:** the remaining items are wide/visual and benefit from the user's eye — recommend a dedicated pass.

## Phase 3 — Marketing platform readiness — ☑ DONE
- ☑ Read the automation engine end-to-end (themes → generate → variants → post → run.ts)
- ☑ Verified `npm run typecheck` clean; `preview` is the safe dry-run path (no live posts triggered)
- ☑ Confirmed graceful degradation: platforms without creds fall back to the queue webhook
- ☑ Confirmed `social-autopost.yml` daily cron + queue handoff
- ☑ `MARKETING_READINESS.md`: verdict NEEDS-WORK (close) — safe to launch queue-only today; bugs B1–B5
  catalogued (notably **B2:** no image pipeline sets `imageUrl`, so IG/Pinterest always queue — now
  addressable via the Phase-5 share-card work).
- **Done:** preview produces valid multi-platform variants; go/no-go checklist is unambiguous.

## Phase 4 — 12-week content calendar — ☑ DONE
- ☑ Reconciled with existing `themes.ts` (52-week)
- ☑ `CONTENT_12_WEEKS.md`: Jun 1–Aug 23 2026 (ISO weeks 23–34), per-week hero post, per-platform angle,
  time-lock beat, CTA. Father's Day (Jun 21, week 3) = conversion peak.
- ☑ Realigned `themes.ts` (w23/w31/w33) to remove forbidden gift/"legacy"/Storyworth framing (voice.ts rule 8); typecheck re-verified clean.
- **Done:** 12 weeks are both human-readable (doc) and machine-driven (themes.ts), typecheck-verified.

## Phase 5 — Zero-budget viral mechanics  *(build functionality)* — ☑ CORE DONE
Growth loops native to the product, no ad spend.
- ☑ **Single source of truth:** `worker/src/lib/share-meta.ts` (pure, **22 tests**) — per-surface
  title/description/og:image/SVG card for kinds: thread, inherit, wrapped, milestone, entry.
  Privacy-safe inherit (no PII), voice-safe (no "legacy"), XSS-safe (escaped).
- ☑ **Public endpoints:** `/api/share/meta` + `/api/share/card.svg` (mounted in `index.ts`, cacheable).
- ☑ **Edge OG injection:** Cloudflare Pages Functions on `/inherit/*` and `/wrapped/*` rewrite the SPA's
  social tags per-surface via HTMLRewriter; real users still get the full SPA; errors fall back safely.
- ☑ **No-404 image contract:** seeded `public/og/{inherit,wrapped,milestone,entry}.png`.
- ☑ `VIRAL_MECHANICS.md`: the five loops ranked by leverage, what shipped, and the one follow-up
  (SVG→PNG rasterisation) plus a per-loop activation checklist.
- ☐ **REMAINS:** in-app share buttons wiring the SVG card; per-kind PNG rasterisation; referral
  attribution polish; milestone/entry in-app triggers (all documented in `VIRAL_MECHANICS.md`).
- **Done:** share-meta module + inherit/wrapped OG loops built, tested, and build-green.

---

## Operating rules for this pass
1. **Evidence before "done"** — run the command, read the output, then claim.
2. **Honor the constitution** — if a change would pass review only by ignoring §2, it's wrong.
3. **Dry-run all marketing** — never trigger a live post; `preview` only.
4. **Commit in coherent slices** per phase, referencing brief sections. Branch off `main` (don't commit to main directly without asking).
5. **Unattended:** proceed through phases without pausing for confirmation unless a decision is
   destructive, irreversible, or outward-facing (e.g. real posting, deleting user-facing routes).
