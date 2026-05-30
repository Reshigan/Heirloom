# Heirloom Autonomous Marketing — Launch Readiness Report

**Date:** 2026-05-30
**Scope:** `marketing/automation/` content engine + `.github/workflows/social-autopost.yml` + worker queue handoff.
**Verdict:** **NEEDS-WORK** (close). Core pipeline is sound and safe; `typecheck` passes; `preview` is genuinely dry-run. Blockers are a stale README secret name and an image-pipeline gap that silently sends every IG/Pinterest post to queue. See §6.

---

## 1. Architecture summary

Two layers (PLAYBOOK §4):

- **Layer B — content engine (`marketing/automation/`).** Single entrypoint `src/run.ts` (subcommands `generate`, `post`, `daily`, `preview`, `metrics`). Pipeline:
  `themes.ts` (52-week ISO calendar + 4 seasonal overrides) → `generate.ts` (Sonnet 4.6 → one `SourcePost`, zod-validated) → `variants.ts` (one Sonnet call → per-platform `Variant[]`, zod-validated) → `post.ts` (routing/dispatch).
  `voice.ts` is the shared system prompt (Thread positioning, cached via `cache_control: ephemeral`). `seo.ts` is a separate one-shot generator for `questions.heirloom.blue` (not on the daily cron). `metrics.ts` is an Ayrshare-based feedback loop, currently a no-op stub (`topHooks` returns `[]`, `pullMetrics` dry-runs without `AYRSHARE_API_KEY`).
- **Layer A — publisher (worker).** `post.ts` POSTs variants to the worker `POST /api/social/bulk-load` (`cloudflare/worker/src/routes/social.ts`), which writes rows to D1 `social_posts`. The worker `*/5 * * * *` cron (`crons/social-posting.ts`) publishes due rows via Postiz. This is the intended production path.

**`post.ts` routing order (per call):**
1. **Worker queue** — if `HEIRLOOM_API_URL` **and** `HEIRLOOM_ADMIN_TOKEN` are set, POST to `/api/social/bulk-load`. On success, done. On failure, **falls through** to direct/queue (good — no dropped posts).
2. **Direct platform API** — per-platform dispatcher (Facebook, Instagram/Reels, LinkedIn, Pinterest, Bluesky). Each one checks its own creds; if absent → `queue()`.
3. **Queue file** — writes `output/<date>/queue/<platform>.md`, optionally pings `QUEUE_WEBHOOK_URL`. Always returns `ok:true, mode:"queue"`. Default for TikTok / X / Threads / YouTube Shorts (no free direct API).

---

## 2. Verification results

| Check | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **PASS** — exit 0, zero errors. |
| `npm run preview` (dry run) | **Ran; failed at generation as expected** — no `ANTHROPIC_API_KEY` in env, so the Claude call in `generateSourcePost` threw before any posting code ran. Theme resolved correctly (`w22-fathersday-prep2`, ISO week 22 for 2026-05-30 — verified). No `output/<date>/` dir created (failed before first write). **This is the documented acceptable outcome.** |
| Preview makes no live posts? | **Confirmed by source.** `preview()` in `run.ts` deletes `META/LINKEDIN/PINTEREST/BLUESKY` creds, then runs `generate` + `postAll`. With creds gone, every dispatcher routes to `queue()` (file write only). The only network call in preview is to the Claude API. No posting API is reachable. **Safe.** |
| Graceful degradation (missing creds → skip, not crash) | **Confirmed.** Every direct dispatcher (`postFacebook`, `postInstagram`, `postLinkedIn`, `postPinterest`, `postBluesky`) early-returns `queue(input)` when its token/id is missing. `queue()` always resolves `ok:true`. `postAll` uses `Promise.all` over `post()` which never throws for missing creds. A platform with absent creds is queued, not crashed. |
| Cron ↔ queue/webhook coherence | **Coherent.** Layer B cron = daily `0 14 * * *` (one generation/post run). Layer A worker cron = `*/5 * * * *` drains `social_posts` via Postiz. `bulk-load` request body built by `post.ts` (`{week, startDate, posts:[{platforms, pillar, content}]}`) matches the worker's validation (`week`, `startDate`, `posts[]` required) and the `social_posts` INSERT. Platform name mapping (`x`→`twitter`, `reels`→`instagram`, `youtubeshorts`→`youtube`) is handled by `variantToPostizPlatform`. |

---

## 3. Secrets / GitHub Actions vars to configure per platform

The workflow reads **secrets** (sensitive tokens) and **vars** (non-sensitive ids) exactly as wired in `social-autopost.yml`. Set them under repo Settings → Secrets and variables → Actions.

| Platform | GitHub **Secrets** | GitHub **Vars** | Notes |
|---|---|---|---|
| **Generation (hard requirement)** | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` (opt, default `claude-sonnet-4-6`) | Without this, nothing generates. |
| **Meta — Facebook** | `META_PAGE_ACCESS_TOKEN` | `META_PAGE_ID` | Needs Meta app review (`pages_manage_posts`). Text posts work without an image. |
| **Meta — Instagram / Reels** | `META_PAGE_ACCESS_TOKEN` (shared) | `META_IG_USER_ID` | **Requires an `imageUrl`/`videoUrl`** or it queues (see §6 bug B2). Needs `instagram_content_publish`. |
| **LinkedIn** | `LINKEDIN_ACCESS_TOKEN` | `LINKEDIN_AUTHOR_URN` | `w_organization_social`. Text-only post supported (`shareMediaCategory: NONE`). |
| **Pinterest** | `PINTEREST_ACCESS_TOKEN` | `PINTEREST_BOARD_ID` | **Requires an `imageUrl`** or it queues (Pinterest needs media). |
| **Bluesky** | `BLUESKY_APP_PASSWORD` | `BLUESKY_HANDLE` | No app review. Text-only works today. (Note: README lists `BLUESKY_HANDLE` as a secret; workflow correctly treats it as a var.) |
| **X / TikTok / Threads / YouTube Shorts** | — | — | No free direct API → always **queue mode**. Need `QUEUE_WEBHOOK_URL` (secret) to notify an operator; operator pastes manually. |
| **Queue notify** | `QUEUE_WEBHOOK_URL` | — | Discord/Slack incoming webhook. Optional but required for the human-in-the-loop queue platforms. |
| **Worker handoff (production path)** | `HEIRLOOM_ADMIN_TOKEN` | `HEIRLOOM_API_URL` (default `https://api.heirloom.blue`) | When **both** set, ALL variants go to the worker queue instead of direct APIs. `HEIRLOOM_ADMIN_TOKEN` must be a valid **admin session token** in worker KV (`admin:session:<token>`), not a static API key — see §6 bug B3. |

Also on the worker side (not GitHub): `CRON_ENABLED=true`, plus `POSTIZ_URL` + `POSTIZ_API_KEY` must be set or the `*/5` cron silently no-ops (posts stay `scheduled` forever).

---

## 4. Go / No-Go checklist

- [x] `typecheck` passes.
- [x] `preview` is dry-run only; no posting API reachable in preview.
- [x] Missing creds degrade gracefully to queue (no crashes).
- [x] Daily ↔ 5-min cron handoff contract matches the worker `bulk-load` schema.
- [x] Brand voice (`voice.ts`) is on Thread positioning, consistent with PLAYBOOK/THREAD/CLAUDE.md.
- [ ] **README secret name corrected** (`AYRSHARE_API_KEY` is stale — workflow uses none). — see B1.
- [ ] **Image pipeline decided** before enabling IG/Pinterest direct mode, OR accept they queue. — see B2.
- [ ] **`HEIRLOOM_ADMIN_TOKEN` lifetime confirmed** — admin session tokens in KV expire; a long-lived cron needs a non-expiring credential path. — see B3.
- [ ] `metrics` loop is a stub — fine for launch, but the "learn from top hooks" feedback is not actually wired (`topHooks` returns `[]`). — see B4.
- [ ] Worker `CRON_ENABLED=true` + `POSTIZ_*` configured (out of this repo's scope to verify).

**Recommendation:** Launch in **queue-only mode** (no Meta/IG/Pinterest tokens yet, operator drains the webhook) is safe today. Direct/worker auto-publish needs B2 + B3 resolved first.

---

## 5. Code correctness notes (verified, no fix applied per instructions)

- `themes.ts` date logic: ISO week + seasonal-window override verified correct for the sampled date.
- `generate.ts` / `variants.ts`: both strip markdown fences and zod-validate; a malformed Claude response throws a clear error (acceptable fail-loud for a cron).
- `post.ts` worker-queue fall-through on failure is correct and prevents dropped posts.
- `run.ts preview` credential-stripping is the right mechanism to guarantee no live post.

---

## 6. Bugs / gaps found

**B1 — README cron instructions name the wrong secret (doc bug, low risk).**
`marketing/automation/README.md` §"Daily cron" says *"Set repo secrets `ANTHROPIC_API_KEY` and `AYRSHARE_API_KEY`."* The live workflow (`social-autopost.yml`) does **not** reference `AYRSHARE_API_KEY` at all — Ayrshare was replaced by direct APIs + the worker queue. `AYRSHARE_API_KEY` only survives in `metrics.ts` (a stub). Following the README would leave an operator looking for a secret that does nothing. The README env table (lines 40–50) is correct; only the step-by-step section is stale.

**B2 — Instagram and Pinterest silently queue because no image pipeline exists (functional gap).**
`postInstagram` returns `queue(input)` unless `input.imageUrl` is set; `postPinterest` does the same. Nothing in `run.ts`/`postAll` ever sets `imageUrl` (the README explicitly says image rendering is "intentionally not implemented" and must be wired into `post.ts`). **Net effect:** even with valid Meta/Pinterest tokens, IG and Pinterest will **always** fall to queue mode. Not a crash, but "direct IG/Pinterest posting" is effectively non-functional until an image service is wired in. Facebook (text), LinkedIn (text), Bluesky (text) post fine without an image.

**B3 — Worker handoff auth may expire under a long-running cron (operational risk).**
The `bulk-load` route authenticates against `admin:session:<token>` in KV — i.e. an **admin login session**, which is normally short-lived. `HEIRLOOM_ADMIN_TOKEN` is a static GitHub secret. If the session expires, the daily POST returns 401; `post.ts` then falls through to direct/queue (so posts aren't lost, but the intended Layer A path silently stops working and IG/Pinterest/X quietly drop to queue). Confirm a non-expiring admin token / service token exists for this route before relying on the worker path.

**B4 — Metrics feedback loop is a stub (expected, but note it).**
`metrics.ts` `topHooks()` always returns `[]` and `pullMetrics` requires `AYRSHARE_API_KEY` (which the pipeline no longer uses). So `generate.ts`'s "avoid repeating recent hooks" negative-prompting receives nothing. Content won't repeat-detect across days. Acceptable for launch; flagged so it isn't mistaken for working.

**B5 — `postFacebook` builds an unused `params` object (dead code, harmless).**
Lines ~153–157 construct a `URLSearchParams` named `params` that is never sent; the actual request uses `body`. No behavioral impact; minor cleanup.

---

## 7. Verdict

**NEEDS-WORK — close to ready.** The engine is architecturally sound, type-clean, and **safe**: preview cannot post, and absent creds degrade to queue without crashing. Safe to launch **today in queue-only mode** (operator drains the webhook for all platforms). Before enabling automated direct/worker publishing, resolve **B2** (image pipeline, or accept IG/Pinterest stay queued) and **B3** (durable worker-handoff auth), and correct **B1** in the README. B4/B5 are non-blocking.
