# Heirloom — Error Handling & Resilience Audit

Scope: Worker API, frontend error boundaries, network-failure handling, Stripe
webhooks, marketing automation, offline behavior. Findings ranked CRITICAL /
HIGH / MEDIUM / LOW. File paths are absolute.

---

## 1. Worker error responses

**File:** `cloudflare/worker/src/index.ts`

- A global `app.onError()` handler exists (lines 853–871): logs via
  `console.error`, maps `Unauthorized` → 401, malformed-JSON/`SyntaxError` →
  400, and falls through to a generic `{ error: 'Internal server error' }` 500
  (with `body.debug = err.message` only when `ENVIRONMENT === 'development'`).
  `app.notFound()` returns a clean `{ error: 'Not found' }` 404.
- The shape returned to the client on an unhandled exception is therefore a
  clean, generic JSON 500 — no stack traces leak in production. **This part is
  solid.**

**MEDIUM — onError has no per-request correlation ID.** `console.error('Error:', err)`
logs the raw error with no request ID, route, or user ID. In Cloudflare's
aggregated logs this makes correlating a specific user's 500 to a trace
difficult — there's no `c.req.path`, `userId`, or a generated `requestId` in
the log line or in the JSON body. Recommend adding a lightweight
`X-Request-Id` (generate if absent) echoed in the response and included in the
`console.error` call, so support tickets ("I got an error at 14:32") can be
traced to a specific log line.

**LOW — rate limiter DO failure fails open for non-auth routes.** In the
`/api/auth/*` rate-limit middleware (lines 261–287), a Durable Object fetch
failure fails closed (503) only for `/api/auth/*`; all other routes "fail
open," which is a reasonable tradeoff documented in a comment, but is worth
flagging as a known gap (an outage of the `RATE_LIMITER` DO silently disables
rate limiting everywhere except auth).

---

## 2. `routes/memories.ts` and `routes/voice.ts` — D1 failure handling

**File:** `cloudflare/worker/src/routes/memories.ts`,
`cloudflare/worker/src/routes/voice.ts`

- **Most GET/list/stats endpoints have NO try/catch around `c.env.DB.prepare(...).all()/.first()`.**
  Examples: `memoriesRoutes.get('/')` (line 48), `.get('/map')` (102–127),
  `.get('/stats/summary')` (140–153), `.get('/:id')` (449–451),
  `voiceRoutes.get('/')` (21–24), `.get('/stats')` (78–84), `.get('/:id')`
  (296–298). If D1 throws (timeout, binding outage, malformed query), these
  bubble up to the global `app.onError` and the client gets a generic 500
  `{ error: 'Internal server error' }`. **This is the correct outcome
  (no silent failure, no data loss)** — the global handler catches it — but the
  error message gives the user zero actionable information ("Internal server
  error" vs. e.g. "Could not load your memories — try again"). **Rank: MEDIUM
  (poor error message / degraded UX)**, not data loss, because reads simply
  fail loudly via the global handler.

- **HIGH — write paths (`POST /`, `PATCH /:id`, `DELETE /:id`) are also
  uncaught around the primary `INSERT`/`UPDATE` D1 calls** (memories.ts lines
  564–567, 678–696, 745–747; voice.ts lines 370–373, 442–457, 505–507). If the
  `INSERT INTO memories ...` at line 564 throws (e.g., D1 write-quota error,
  transient binding failure), the request 500s via the global handler and the
  user sees "Internal server error" with **no indication whether the memory
  was actually saved**. Because there's no idempotency key and no client-side
  retry-with-dedupe in `Compose.tsx`'s `useMutation` (it just shows
  `'Could not save the entry.'` and lets the user press the button again), a
  D1 write that *partially* succeeds (e.g., the `INSERT` commits but a
  subsequent `mirrorIntoDefaultThread` or recipient-insert throws) can produce
  a duplicate memory on retry, or — worse — leave the user believing nothing
  was saved when it was. This is a **user-visible failure with an unclear
  recovery path** (resubmitting risks duplicates; not resubmitting risks data
  loss from the user's perspective).
  - Concretely: `memoriesRoutes.post('/')` does `INSERT` (564) →
    `mirrorIntoDefaultThread` (570, "best-effort" per its own comment, but NOT
    wrapped in try/catch here) → recipient ownership check + `DB.batch` insert
    (576–590) → recipient email loop (596–625) → final `SELECT` (627). A throw
    anywhere after the `INSERT` produces a 500 even though the memory row now
    exists; the client sees a failure and the user may re-submit, creating a
    duplicate "thread" entry — which directly conflicts with the product's
    "never lose / never duplicate a thread" append-only guarantee.

- **MEDIUM — `mirrorIntoDefaultThread` is documented as "best-effort; never
  blocks the legacy write"** (memories.ts line 569 comment, voice.ts line 375)
  but is awaited with no surrounding try/catch at the call site in either
  route. If `mirrorIntoDefaultThread` itself doesn't internally swallow errors,
  the comment's promise ("never blocks") is false — an exception there would
  abort the whole request after the row is already committed (see HIGH above).
  Recommend verifying `services/threadMesh.ts` wraps its body in try/catch (not
  read in this pass) and, regardless, wrapping the call site too, defensively.

- **LOW — voice transcription (`POST /:id/transcribe`, `POST /transcribe-all`)
  is well-handled**: both wrap the Whisper `ai.run()` call in try/catch and
  return descriptive `{ error, details }` 500s (voice.ts lines 547–576,
  595–620). This is a good pattern that the memory/voice CRUD write paths
  should be brought up to.

- **Storage-quota check is correctly fail-safe**: `checkStorageQuota` runs
  *before* the row insert and returns a clear 413 with `used`/`cap` (memories.ts
  496–508; voice.ts 351–362) — good UX, no silent failure.

---

## 3. `services/tinyllm.ts` — `classifyEmotionWithAI`

**File:** `cloudflare/worker/src/services/tinyllm.ts`

- **`classifyEmotionWithAI` (lines 213–253) is well-defended:**
  - Returns the keyword-based `classifyEmotion(text)` immediately if no `Ai`
    binding is present (line 218–220).
  - Wraps the `ai.run('@cf/meta/llama-2-7b-chat-int8', ...)` call in try/catch
    (222–249); on any failure it logs `console.error('Cloudflare AI emotion
    classification failed:', error)` and **falls through to the keyword-based
    fallback** (line 252).
  - Validates the model's output against the known `EmotionType` union before
    trusting it (240–245), with another fallback to keyword classification if
    the response is malformed.
- **Conclusion: Workers AI being unavailable does NOT block memory creation.**
  `memoriesRoutes.post('/')` calls `classifyEmotionWithAI(textToClassify, c.env.AI)`
  (line 517) and always receives a result — AI success, AI garbage, or AI
  outage all converge on a usable `EmotionResult`. This is a **model example of
  graceful degradation** — no finding here beyond noting it as the standard the
  rest of the codebase (the write-path try/catches above) should match.
- Same pattern is used consistently in `generateLetterSuggestionWithAI`,
  `transcribeAudioWithAI`, and `summarizeTextWithAI` (all try/catch + fallback
  to `null`/template). **LOW** note: `transcribeAudioWithAI` and
  `summarizeTextWithAI` return `null` silently on failure with no
  caller-visible signal beyond the `null` — fine for these "nice-to-have"
  enrichments, just worth knowing callers must check for `null`.

---

## 4. Frontend error boundaries

**Files:** `cloudflare/frontend/src/App.tsx`,
`cloudflare/frontend/src/components/ErrorBoundary.tsx`

- **A single `<ErrorBoundary>` wraps the entire app** at the outermost layer
  (App.tsx line 252, around `<QueryClientProvider>` → `<BrowserRouter>` → ...).
  There are **no per-section/per-route boundaries** — a throw in any one lazy
  page (e.g., `Compose`, `MemoryRoom`, `ThreadDetail`) unmounts the *entire*
  app (nav, cloth backdrop, bottom nav — everything), not just that page.
- **What the user sees on a thrown error** (`ErrorBoundary.tsx` lines 31–89):
  a centered card, "Something went wrong / We encountered an unexpected error.
  Please try again or refresh the page," with **Try Again** (resets local
  `hasError` state) and **Refresh Page** (`window.location.reload()`) buttons,
  plus a collapsible `<details>` showing `error.message` (always shown, not
  gated on `import.meta.env.DEV` — see below).
  `componentDidCatch` only `console.error`s; no telemetry/Sentry-style
  reporting.
- **MEDIUM — error boundary is a single global wrapper, not scoped per
  route/section.** A crash in one lazy-loaded page (e.g., a malformed API
  response in `ThreadDetail`) takes down the whole shell rather than showing a
  contained "this section failed to load" inline message while leaving
  navigation intact. Given the app has 70+ routes and many independent
  lazy-loaded pages, scoping boundaries at least at the route-render level
  (wrap `<Routes>` children, or wrap each lazy page) would dramatically reduce
  blast radius and let the user navigate away from a broken page rather than
  being stuck staring at a full-screen "Something went wrong."
- **LOW — `error.message` is always rendered to the user**, regardless of
  environment (`ErrorBoundary.tsx` lines 73–82: no `import.meta.env.DEV` gate,
  unlike the worker's `onError` which correctly gates `body.debug` on
  `ENVIRONMENT === 'development'`). In production this can leak internal
  details (stack hints, library names, occasionally URLs/keys embedded in
  error strings from third-party SDKs) into a user-visible `<pre>` block. This
  is a minor information-disclosure smell and an inconsistency with the
  worker's own (correct) practice — recommend gating behind a dev/staging flag.
- **LOW — visual style mismatch**: the fallback uses `bg-void`, `text-paper`,
  `rounded-lg`, `bg-gold/...` Tailwind classes — the legacy v1/v2 palette, not
  the canonical Loom `ink`/`bone`/`warm`/0px-radius tokens (per
  `STITCH_BRIEF.md` §2 / CLAUDE.md "Design constitution"). The CSS bridge
  (`loom-bridge.css`, mentioned in `LoomShellRoot`'s comment) likely re-themes
  these classes at runtime, so it may render correctly — but the component
  itself is not written against the canonical primitives, so a bridge change
  could silently break the one screen users see when everything else is on
  fire. Worth migrating to `hl-*`/Loom primitives for consistency and
  resilience-of-the-resilience-UI.

---

## 5. Network failure handling — `services/api.ts`

**File:** `cloudflare/frontend/src/services/api.ts`

- **401 (token expiry):** Handled well (lines 67–93). A single in-flight
  `refreshPromise` is shared across concurrent 401s (avoiding the
  single-use-refresh-token race documented in the comment at lines 45–49,
  "H5"/concurrent-401 fix). On refresh failure: clears tokens and redirects to
  `/login?session_expired=true` (preserving whether there was a session). Auth
  endpoints (`/auth/*`) are excluded from the retry-with-refresh loop to avoid
  infinite loops. **Solid.**
- **429 (rate limited):** Handled (lines 57–63) — reads `Retry-After`, rewrites
  `error.message` to a human string ("Too many requests. Please wait N seconds
  before trying again."), then rejects so callers can surface it.
- **HIGH — no interceptor for 503 / 502 / 504 (service unavailable / gateway
  errors) or network-level failures (no `error.response` at all, e.g. DNS
  failure, CORS, timeout).** The interceptor only special-cases `429` and
  `401`; any other status — including `500`, `502`, `503`, `504` — and any
  request that never reaches the server (network down, the worker is fully
  down, CORS preflight failure) falls through to the bare
  `return Promise.reject(error)` at line 94 with **no rewritten message, no
  generic "service unavailable" framing**. Each calling component must
  individually detect and handle this (see next point) — there's no
  centralized "the API is down" UX. Given the worker is the single edge API
  for the entire product (memories, letters, voice, billing, family, etc.), an
  outage there currently surfaces as whatever raw Axios error message each
  component happens to display (or doesn't).
- **MEDIUM-to-HIGH — inconsistent component-level handling.** Spot-checked
  `Compose.tsx`: the save mutation *does* have an `onError` that calls
  `setError(err?.response?.data?.error ?? 'Could not save the entry.')` (line
  748–750) — a reasonable fallback message — but this pattern is not
  guaranteed across the ~70 pages/components that call `memoriesApi`,
  `lettersApi`, `voiceApi`, `billingApi`, etc. (not exhaustively audited here;
  recommend a grep for `useMutation`/`.then(`/`await ...Api.` calls without a
  paired `.catch`/`onError` across `src/pages/` as a follow-up). Any component
  that does a bare `await someApi.get(...)` inside a `useEffect` or handler
  without try/catch will produce an unhandled promise rejection — a console
  error with **no user-visible feedback** (the screen just silently fails to
  populate).
- **LOW — `clearTokens()` removes `heirloom-auth` but `hadSession` is read just
  before** (line 87–89) — correct ordering, no bug, but fragile: any future
  refactor that reorders these two lines silently breaks the
  "session_expired vs. fresh login" messaging. Worth a comment anchor or a
  small helper to make the ordering dependency explicit (it already has one,
  but it's easy to miss on a quick edit).

---

## 6. Stripe webhook failures — `routes/billing.ts`

**File:** `cloudflare/worker/src/routes/billing.ts` (handler at line 891)

- **Signature verification is solid**: custom HMAC-SHA256 `verifyStripeSignature`
  with timestamp-tolerance check (lines 841–888); missing secret/signature →
  400, invalid signature → 401 + `console.error`.
- **CRITICAL — `checkout.session.completed` → subscription upgrade has NO
  retry / dead-letter / reconciliation path if the DB write fails.**
  The "regular subscription checkout" branch (lines 1093–1119):
  ```
  if (userId) {
    const existing = await c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ?')...
    ...
    await c.env.DB.prepare(`UPDATE subscriptions SET tier = ?, status = 'ACTIVE', ...`)... // or INSERT
  }
  ```
  This is the **exact "paid but not upgraded" scenario** named in the audit
  brief. If this `UPDATE`/`INSERT` throws (D1 transient failure, lock
  contention, schema drift), the exception propagates to the outer
  `try { ... } catch (error) { console.error('Webhook error:', error); return
  c.json({ error: 'Webhook processing failed' }, 500); }` (lines 1225–1228).
  Returning **500 to Stripe is actually the *correct* signal** — Stripe will
  retry webhook delivery on a 5xx with exponential backoff for up to 3 days —
  so this is not maximally bad. **However:**
  - There is **no logging of the event ID, user ID, or session ID at the point
    of failure** beyond the generic `console.error('Webhook error:', error)` —
    if Stripe's retries also fail (e.g., a sustained D1 outage spanning 3
    days, or a code regression that always throws on this code path), the
    event is silently dropped with **zero record** that a real human paid and
    didn't get upgraded. There is no `billing_errors` row written for this
    failure mode (contrast with `invoice.payment_failed`, which *does* insert
    into `billing_errors` — lines 1167–1171).
  - There is **no idempotency / reconciliation job** that cross-checks Stripe's
    record of completed checkouts against `subscriptions.status`. The nightly
    cron (`scheduled` handler in `index.ts`) runs many jobs but nothing that
    asks "does every PAID Stripe customer have an ACTIVE subscription row?"
  - **Net effect: a payment can succeed in Stripe, the webhook can fail at the
    DB write, Stripe's 3-day retry window can be exhausted (e.g., by a
    sustained outage or a silent code bug that 500s every time), and the
    customer is left paying for a tier they never received — with no
    `billing_errors` record, no admin alert, and no automatic recovery.** This
    is the textbook "payment stranded" failure mode named in the brief.
  - **Rank: CRITICAL** (silent data loss / payment-stranding potential, even
    though the immediate 500 → Stripe-retry behavior softens the *common* case).
  - **Recommended fix**: (a) wrap the subscription `UPDATE`/`INSERT` in its own
    try/catch that writes a `billing_errors` row (mirroring the
    `invoice.payment_failed` pattern) *before* re-throwing/500ing, so there's
    always a durable record even if all of Stripe's retries are exhausted; (b)
    add a daily reconciliation cron job comparing recent Stripe
    `checkout.session.completed` events (or `subscriptions` Stripe-side state
    via the Stripe API) against local `subscriptions` rows, alerting
    `ADMIN_NOTIFICATION_EMAIL` on mismatches; (c) log `event.data.object.id` /
    `userId` / `tier` in the `console.error` so a manual fix is at least
    possible from logs alone.

- **MEDIUM — `founder_pledge` and `gift_voucher` branches swallow DB/email
  errors with only `console.error`, no `billing_errors` row, no retry signal**
  (lines 933–973 founder; 1031–1090 gift voucher). A payment can succeed,
  `UPDATE founder_pledges SET status = 'PAID' ...` can fail silently (caught at
  971–973, logged, loop `break`s, handler still returns `c.json({ received:
  true })` 200 to Stripe — **so Stripe will NOT retry**, because the outer
  `switch` doesn't re-throw). This is *worse* than the subscription path: the
  webhook returns 200 (received) even though the actual state mutation failed,
  so **Stripe considers the webhook delivered and will never retry**, and
  there's no `billing_errors` row to flag it for a human. Net: a Founder
  pledge can be paid and never marked PAID/get its welcome email, with zero
  trace. Same risk profile applies to the gift-voucher purchaser/recipient
  emails (caught + logged but the voucher might still flip to PAID even if
  notification emails fail — acceptable for emails, but the *voucher PAID
  update itself* at lines 1036–1040 is NOT in its own try/catch and would
  bubble to the outer 500/Stripe-retry path, which is fine — the asymmetry is
  the founder-pledge branch's inner catch-and-swallow-and-`break`).
  - **Rank: MEDIUM-leaning-HIGH** for founder pledges specifically — low
    volume (capped at 100), high-value ($999 lifetime), and currently the
    *only* payment path in the codebase that can both fail AND ack 200 to
    Stripe. Recommend removing the inner try/catch's `break` (or re-throwing)
    so a DB failure here also produces a 500 → Stripe retry → eventual
    `billing_errors`-style record, consistent with the rest of the handler.

- **LOW — `invoice.payment_succeeded` / `customer.subscription.updated` /
  `.deleted` branches have no inner try/catch**, but that's *fine* — an
  exception there bubbles to the outer 500, which triggers Stripe's retry.
  This is actually the more robust pattern than the founder-pledge branch's
  catch-and-swallow.

---

## 7. Marketing engine — `marketing/automation/src/run.ts`

**File:** `marketing/automation/src/run.ts`,
`marketing/automation/src/generate.ts`,
`.github/workflows/social-autopost.yml`

- **Dormant-key handling is graceful and intentional**: if `ANTHROPIC_API_KEY`
  is absent, the engine logs `[dormant] ANTHROPIC_API_KEY not set — marketing
  engine is idle...` and `process.exit(0)` (lines 288–295) — exits *cleanly*,
  not as a CI failure. This matches the documented behavior in CLAUDE.md
  ("Marketing engine dormant").
- **HIGH — once the key IS present, an Anthropic API failure (quota exceeded,
  timeout, 5xx) crashes the run loudly with no retry and no alert beyond the
  CI log.** `generateSourcePost` (`generate.ts` lines 77–110) makes a single
  `client.messages.create(...)` call with **no try/catch, no retry/backoff**.
  Any SDK-level error (rate limit 429, overloaded 529, network timeout,
  auth failure on a rotated/expired key) propagates straight up through
  `generate()` → `daily()`/`preview()`/`postAll()` → the top-level
  `handler().catch((err) => { console.error(err); process.exit(1); })` (lines
  325–328 of `run.ts`).
  - **Result: the GitHub Actions job fails red** (exit code 1). There is *no*
    in-app alerting (no email/Slack/webhook on failure) beyond whatever GitHub
    Actions' own failure-notification settings produce (which depend on repo
    watcher/notification settings, not anything in this codebase). If nobody
    is watching Actions emails, a sustained Anthropic outage or a
    quota-exceeded condition silently stops the daily content engine
    indefinitely with zero proactive signal to the team — exactly the "crashes
    loudly but nobody hears it" scenario.
  - Compare with the *dormant* path, which is handled with care and grace —
    the *failure* path (key present, call fails) gets none of that same
    attention.
  - **Rank: HIGH** (user-visible-to-operators failure — i.e., the daily post
    simply stops appearing — with no recovery path beyond someone noticing the
    silence or manually checking Actions logs).
  - **Recommended fix**: wrap the `client.messages.create` call in try/catch
    with at least one retry-with-backoff for transient errors (429/529/5xx/
    timeout — the Anthropic SDK exposes typed errors for these), and on final
    failure send a notification via the existing `sendEmail`/admin-notification
    infrastructure already present in the worker (`ADMIN_NOTIFICATION_EMAIL`)
    or a simple webhook POST — the workflow already has `QUEUE_WEBHOOK_URL`
    wired for a different purpose and a similar pattern could alert on
    generation failure. At minimum, log a structured failure marker that a
    follow-up health-check cron (the worker already runs a 9 AM daily cron)
    could detect by checking "has `marketing/automation/output/<today>/` been
    committed?" and alert the admin email if not.
- **LOW — `JSON.parse` failure on Claude's response is handled** (`generate.ts`
  lines 102–107: wrapped in try/catch, re-thrown with a truncated raw-text
  preview) — good for debuggability, but it still ultimately crashes the run
  (no fallback/retry), folding into the same HIGH finding above.
- **LOW — per-platform posting failures are handled gracefully** and do not
  crash the run: `postAll()` uses `Promise.all` + per-result `ok`/`error`
  logging (`run.ts` lines 113–129), and `post()` (not read in this pass, but
  referenced as routing to a "queue" mode when tokens are absent per the
  `NEEDS_CLAUDE`/preview comments) appears to degrade gracefully per-platform.
  This is the right pattern — the *generation* step is the single point of
  total failure, not the multi-platform fan-out.

---

## 8. Offline behavior — `public/sw.js` + `pages/Offline.tsx`

**Files:** `cloudflare/frontend/public/sw.js`,
`cloudflare/frontend/src/pages/Offline.tsx`

This is the **strongest-engineered area in the audit** — a deliberate,
well-commented, and honestly-scoped offline design:

- **Composing while offline is explicitly supported** via a "holding queue"
  (`Offline.tsx`): entries are persisted to `localStorage` under
  `heirloom-offline-holding` (`QUEUE_KEY`), shown in a "holding offline · N"
  list, and explicitly labeled "not sent until you reconnect" / "will sync
  when connected · no data sent until then" — **no false claims of sync** (the
  file's own header comment is refreshingly candid: "we never claim it
  synced").
- **A real drain/sync mechanism exists**: `useSyncHoldingQueue` (lines
  292–382) fires on the offline→online transition, batches entries (3 at a
  time, `BATCH_SIZE`), posts them via `memoriesApi.create(...)` with
  `Promise.allSettled`, removes only the *successful* ones from the queue
  (`writeQueue(readQueue().filter((e) => !synced.includes(e.id)))` — line 351),
  and leaves failed ones for the next reconnect attempt. It also recovers from
  a 401-during-offline edge case (the `[SW3]` comment, lines 298–306) by
  re-arming the sync on next authentication.
- **SW-level network strategy is sound and documented**: navigations are
  network-first with cached-shell and offline-page fallback; `/api/*` GETs are
  network-first with an `API_CACHE` fallback for offline reads; **mutations
  (`POST`/`PATCH`/`DELETE`) are explicitly never intercepted** — "they go live
  or fail" (sw.js lines 76–95) — which is the correct behavior (mutations must
  not be silently cached/replayed by the SW; the app-level holding queue is the
  right layer for that).
- **MEDIUM — closed-app background sync is a documented no-op.** The `sync`
  event handler (sw.js lines 178–186) only relays `hl-queue-sync` to *already
  open* client windows; if the app is fully closed, "the clients array is empty
  and the relay is a no-op," per the SW's own comment (lines 175–177), which
  candidly notes "Full closed-app sync would require the SW to read IndexedDB
  and call the API directly (a future enhancement once VAPID + auth-token
  forwarding are wired)." This means a user who writes offline, closes the
  app/tab, and reconnects later will only have their queue drained the next
  time they *open* the app (the `online` event + `wasOfflineRef` logic in
  `OfflineGate` handles that case correctly) — not via true background sync.
  This is a known, documented, and reasonable scoping choice, not a bug — but
  worth flagging as a real (if minor) gap versus the "Background Sync API"
  promise implied by registering the `sync` listener at all.
- **LOW — the offline holding-queue write type is a documented compromise**:
  entries sync as `type: 'LETTER'` with `title: 'offline note'` (lines
  319–333, `[SW1]` comment explains this is "the least-wrong option" because
  the backend schema has no freeform-text memory type). This is honestly
  commented and low-risk, but does mean offline-authored content lands in the
  user's Letters list rather than as a Memory — a minor surprise for users who
  expect symmetry between online and offline composing. Worth a product note
  if it isn't already known.
- **LOW — `localStorage` quota/private-mode failures are silently swallowed**
  (`writeQueue`/`readQueue`/`readSince`, lines 39–72: bare `catch {}` /
  `catch { /* quota / private mode — the line stays in component state
  regardless */ }`). The comment shows this was a conscious choice — the draft
  text survives in component state even if persistence fails — but a user in
  Safari Private Browsing (which throws on `localStorage.setItem`) would see
  their "holding" entry vanish on refresh with no warning that persistence
  isn't working. A one-time inline notice ("this browser can't hold drafts
  offline — keep this tab open") would close that gap.

**Overall: offline is the one area of this audit that meets a "production
ready" bar without caveats beyond minor UX polish.**

---

## Summary table

| # | Area | Finding | Rank |
|---|---|---|---|
| 6 | Stripe `checkout.session.completed` subscription write | DB failure can strand a paid user with no `billing_errors` record, no reconciliation job, no alert if Stripe's 3-day retry window is exhausted | **CRITICAL** |
| 6 | Stripe `founder_pledge` branch | Catches DB failure, logs, `break`s, but still ACKs 200 to Stripe → **no retry will ever fire**; a $999 lifetime payment can be stranded silently | **HIGH** (effectively payment-stranding with worse recovery odds than the general case) |
| 2 | `memories`/`voice` POST/PATCH/DELETE | No try/catch around primary D1 write; a throw after a successful `INSERT` produces a 500 the user may retry, risking duplicate "thread" entries or perceived data loss | **HIGH** |
| 5 | `services/api.ts` interceptor | No handling for 502/503/504/network-down — falls through to raw Axios error with no centralized "service unavailable" UX | **HIGH** |
| 7 | Marketing `generateSourcePost` | No try/catch/retry around the Anthropic call; any transient failure (quota, timeout, 529) crashes the daily cron with only a CI-log signal, no proactive alert | **HIGH** |
| 4 | Global `<ErrorBoundary>` | Single app-wide boundary — any one page's crash takes down the entire shell instead of being contained | **MEDIUM** |
| 1 | `app.onError` | No request-correlation ID in logs/responses — hard to trace a specific user's 500 | **MEDIUM** |
| 2 | `memories`/`voice` GET/list/stats | Uncaught D1 reads bubble to the generic 500 "Internal server error" — correct fail-loud behavior, but unhelpful message | **MEDIUM** |
| 5 | Component-level API call handling | Inconsistent try/catch / `onError` coverage across ~70 pages; some bare `await ...Api.get()` calls likely produce silent unhandled-rejection failures | **MEDIUM** |
| 8 | SW background sync | Documented no-op when app is fully closed; queue only drains on next app-open | **MEDIUM** |
| 4 | `ErrorBoundary` message disclosure | `error.message` always shown to users (no dev-only gate), unlike the worker's correctly-gated `body.debug` | **LOW** |
| 4 | `ErrorBoundary` styling | Uses legacy `bg-void`/`text-paper`/`rounded-lg` classes, not canonical Loom `ink`/`bone`/0px-radius primitives | **LOW** |
| 1 | Rate-limiter DO outage | Fails open for all non-auth routes (a documented tradeoff, just worth tracking) | **LOW** |
| 7 | Per-platform post failures | Already handled gracefully via `Promise.all` + per-result logging — no action needed | **LOW** (informational) |
| 8 | `localStorage` failure in offline queue | Silently swallowed; private-mode users lose drafts on refresh with no warning | **LOW** |
| 3 | `classifyEmotionWithAI` and friends | Exemplary try/catch + fallback pattern — model for the rest of the codebase | **(positive finding — no action)** |

---

## Top 3 recommended fixes (highest leverage)

1. **Stripe `checkout.session.completed` reconciliation** (CRITICAL): wrap the
   subscription `UPDATE`/`INSERT` in its own try/catch that (a) writes a
   `billing_errors` row before re-throwing (so the 500 → Stripe-retry path
   *and* a durable audit trail both exist), and (b) add a daily reconciliation
   cron comparing Stripe's checkout-session state to local `subscriptions`
   rows, alerting `ADMIN_NOTIFICATION_EMAIL` on drift. Apply the same
   `billing_errors`-on-failure pattern (and stop swallowing-and-`break`ing) in
   the `founder_pledge` branch so a failed write there also triggers a Stripe
   retry rather than a silent 200-ack.

2. **Memory/voice write-path try/catch + idempotency** (HIGH): wrap the
   primary `INSERT`/`UPDATE` D1 calls in `memories.ts`/`voice.ts` POST/PATCH/
   DELETE in try/catch that returns a clear, actionable error (mirroring the
   transcription endpoints' `{ error, details }` pattern), and consider a
   client-supplied idempotency key (e.g., a UUID generated client-side and
   stored in the draft) so a retried `POST /memories` after a network blip
   can't produce a duplicate append-only entry.

3. **Marketing-engine failure alerting** (HIGH): wrap `generateSourcePost`'s
   Anthropic call in try/catch with backoff-retry for transient errors, and on
   exhaustion send a notification through the existing email infrastructure
   (`ADMIN_NOTIFICATION_EMAIL` / `sendEmail`) so a quota-exceeded or sustained
   outage doesn't go unnoticed beyond a red GitHub Actions run that nobody is
   watching.
