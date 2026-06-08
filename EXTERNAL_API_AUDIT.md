# External API Audit — Heirloom

**Date:** 2026-06-07  
**Scope:** `cloudflare/worker/src/` and `marketing/automation/src/`  
**Auditor:** Claude Code (claude-sonnet-4-6)

---

## CRITICAL

### C-1 · Stripe webhook: no idempotency guard — duplicate events process twice
**File:** `cloudflare/worker/src/routes/billing.ts`, lines 922–1229  
**Gap:** There is no `stripe_events` table (or any event-ID deduplication). Stripe guarantees at-least-once delivery and explicitly recommends idempotency checks keyed on `event.id`. A `checkout.session.completed` event replayed by Stripe (network retry, dashboard resend, or Stripe's own retry logic) will re-run the full `UPDATE/INSERT` on `subscriptions` and re-send all confirmation emails. For `founder_pledge`, the pledge_number sub-query `SELECT COALESCE(MAX(pledge_number), 0) + 1` is not atomic — a replayed event on the same `pledgeId` is blocked only because `status = 'PLEDGED'` was already changed to `'PAID'`, so that specific case is safe. But the gift-voucher block (lines 1032–1090) has no such guard and will resend purchaser + recipient emails on every replay.  
**Production impact:** Duplicate subscription upgrades are idempotent in practice (UPDATE is a no-op if values match), but duplicate emails fire on every replay. For the gift voucher flow, a recipient could receive the voucher code multiple times. On `invoice.payment_succeeded` / `invoice.payment_failed` the `UPDATE` is safe but fires on every retry.  
**Fix:** Create a `stripe_events (event_id TEXT PRIMARY KEY, processed_at TEXT)` table. At the top of the webhook handler, attempt `INSERT INTO stripe_events (event_id, processed_at) VALUES (?, datetime('now'))` and return `200 { received: true }` early if it already exists (SQLite `UNIQUE` violation = already processed). No other changes required.

---

### C-2 · Stripe webhook: `customer.subscription.deleted` sets `tier = 'STARTER'` but does not revoke Founder lifetime access
**File:** `cloudflare/worker/src/routes/billing.ts`, lines 1200–1221  
**Gap:** The `customer.subscription.deleted` handler unconditionally sets `tier = 'STARTER'`. Founder accounts hold a one-time lifetime plan (`LEGACY` tier) — there is no recurring Stripe subscription for them. If a Founder's subscription object is ever deleted in Stripe (e.g., admin error, webhook misconfiguration, or if a Founder also held a Family trial), their account would be silently downgraded to Free/Starter.  
**Production impact:** Silent permanent downgrade of Founder ($249 lifetime) accounts. Recoverable only by manual DB fix — and only if noticed.  
**Fix:** Before updating, check `SELECT tier FROM subscriptions WHERE stripe_subscription_id = ?`. If `tier IN ('LEGACY', 'FOREVER')`, skip the update or set `tier = 'LEGACY'` explicitly. Alternatively, Founders should never have a `stripe_subscription_id` stored (their checkout uses `mode: 'payment'`, not `mode: 'subscription'`), so confirm the query reliably returns no row for them.

---

## HIGH

### H-1 · Stripe webhook: signature comparison uses string equality — timing attack possible
**File:** `cloudflare/worker/src/routes/billing.ts`, lines 841–888  
**Gap:** The custom `verifyStripeSignature` function computes the HMAC-SHA256 of the signed payload and compares via `computedSignature === expectedSignature` (line 887). This is a standard string comparison, which is not constant-time. A timing oracle can be used to forge valid signatures.  
**Production impact:** Low probability in practice (requires ~2^32 requests to a live endpoint), but the Stripe library implements a constant-time comparison specifically to prevent this. The risk is non-zero.  
**Fix:** Replace the string equality check with a constant-time comparison using `crypto.subtle.timingSafeEqual` (available in Workers via the Web Crypto API). Encode both signatures as `Uint8Array` first.

---

### H-2 · `preview` command in marketing engine does NOT clear worker-queue credentials
**File:** `marketing/automation/src/run.ts`, lines 132–143  
**Gap:** The `preview()` function deletes `META_PAGE_ACCESS_TOKEN`, `LINKEDIN_ACCESS_TOKEN`, `PINTEREST_ACCESS_TOKEN`, and `BLUESKY_HANDLE` to prevent direct posting. However, it does NOT delete `HEIRLOOM_API_URL` or `HEIRLOOM_ADMIN_TOKEN`. If both env vars are set (e.g., in a CI environment that has them), `postToWorkerQueue()` runs first (line 59 in post.ts), succeeds, and the post is queued to the production worker — even though the caller intended a dry-run.  
**Production impact:** Running `npm run preview` in any environment where `HEIRLOOM_API_URL` + `HEIRLOOM_ADMIN_TOKEN` are set will silently queue real posts to the production social pipeline. This is the opposite of "safe preview."  
**Fix:** In `preview()`, also add:
```ts
delete process.env.HEIRLOOM_API_URL;
delete process.env.HEIRLOOM_ADMIN_TOKEN;
```

---

### H-3 · IPFS/Web3.Storage — deprecated API endpoint in use
**File:** `cloudflare/worker/src/services/archive.ts`, line 152  
**Gap:** The code calls `https://api.web3.storage/upload` — this is the Web3.Storage **legacy** API that was sunset in late 2024. The service migrated to the w3up (w3s.link) API. The endpoint returns 410 Gone or rejects new uploads.  
**Production impact:** The IPFS continuity guarantee is silently broken for Web3.Storage. Since `pinToWeb3Storage` failing just returns `{ ok: false }` (no exception, no alert), this goes undetected. Thread snapshots are only pinned to Pinata (if the JWT is set), halving the redundancy. The product page at `/continuity` still claims dual-provider IPFS archival.  
**Fix:** Migrate to the w3up client (`@web3-storage/w3up-client`). In the short term, add alerting when both providers fail for a thread (currently results are silently discarded if `!r.ok`).

---

### H-4 · IPFS gateway used for verification (`cloudflare-ipfs.com`) is deprecated
**File:** `cloudflare/worker/src/services/archive.ts`, line 247  
**Gap:** The `verifyPins` function uses `https://cloudflare-ipfs.com/ipfs/${cid}` for HEAD checks. Cloudflare shut down their public IPFS gateway (`cloudflare-ipfs.com`) in 2024.  
**Production impact:** Every pin verification call fails with a connection error or 410, so all pins get marked `FAILED` in the `archive_pins` table during the verification cron. The continuity audit dashboard shows all pins as broken even if they are healthy on Pinata.  
**Fix:** Replace with `https://ipfs.io/ipfs/` or `https://dweb.link/ipfs/` (Protocol Labs-operated, stable). Using the provider's own API to verify (Pinata's pinList endpoint) is more reliable than a gateway HEAD check.

---

### H-5 · Push notification send queue: no actual delivery to browser (VAPID dormant)
**File:** `cloudflare/worker/src/routes/push-notifications.ts`, lines 282–318; `cloudflare/worker/src/services/pushSender.ts`, lines 246–259  
**Gap:** The `/push-notifications/send-test` endpoint (and `sendPushToUser`) only writes to `push_notification_queue` with `status = 'pending'`. Delivery only happens when `processPushNotificationQueue` is called from a cron. That function skips entirely if none of `APNS_*`, `FCM_*`, or `VAPID_*` env vars are set (lines 246–252). Per the MEMORY.md, VAPID keys have not been configured in production.  
**Production impact:** Users who opt in to push notifications see a success response but never receive any notifications. The queue accumulates indefinitely. The "Test Notification" button in the UI silently fails.  
**Status / Severity:** Documented as dormant in MEMORY.md — this is a known gap, not a regression. Flagged here because the UI surface (subscribe button, test button) implies delivery that never happens.  
**Fix:** Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT to Cloudflare secrets. The sender code in `webPushSender.ts` is complete and correct.

---

## MEDIUM

### M-1 · Email: one uncaught `sendEmail` can crash the account-deletion request
**File:** `cloudflare/worker/src/routes/settings.ts`, line 801  
**Gap:** The account-deletion route calls `await sendEmail(...)` with no `try/catch`. If the email provider (MS Graph + Resend fallback) both fail, the unhandled rejection propagates up and the route returns a 500 error. The user's account has already been marked `status = 'ARCHIVED'` and `delete_after` set in the DB (line 797), but the `200 { success: true }` response is never sent. The client sees an error, so the user may retry — and hit the 409 / duplicate-update path, or see a confusing error after their account was already scheduled for deletion.  
**Production impact:** User's account is irreversibly scheduled for deletion, but they receive an error response suggesting the action failed. Confusing UX; potential support escalation.  
**Fix:** Wrap `await sendEmail(...)` at line 801 in a `try/catch`. Email failure should log but not throw — the account-deletion DB write already succeeded.

---

### M-2 · Email: no send-rate deduplication for repeated form submissions
**File:** `cloudflare/worker/src/utils/email.ts` (entire file)  
**Gap:** `sendEmail` logs to `email_logs` but does not check that table before sending. There is no guard against sending the same email type to the same address within a time window. Repeated form submissions (e.g., a user clicking "Invite" twice, or a webhook replaying, or a user clicking "Request password reset" rapidly) will send N emails to the recipient with no throttle.  
**Production impact:** Recipients can receive duplicate invitation, verification, or gift-voucher emails. Not money-losing, but reputation-damaging (inbox spam, trust erosion).  
**Fix:** Before sending, query `email_logs` for a recent matching `(to_email, subject)` within a 5-minute window. If found, skip and return `{ success: true, messageId: 'deduped' }`. Alternatively, add `email_type` + `to_email` + a short TTL KV key.

---

### M-3 · Marketing engine: no timeout on platform API calls — worker queue fetch can hang
**File:** `marketing/automation/src/post.ts`, lines 96–112 (`postToWorkerQueue`), 152–190 (`postFacebook`), 228–258 (`postLinkedIn`), etc.  
**Gap:** No `fetch` call in `post.ts` has an `AbortSignal` timeout. The GitHub Actions job has a 6-hour timeout, but a single hung platform API (e.g., Meta Graph rate-limiting with a slow response, or a misconfigured proxy) will block the entire `Promise.all` at line 114 of `run.ts` indefinitely in practice.  
**Production impact:** Daily cron job hangs, blocking subsequent runs. All platform results for that day are lost. No alert fires until the 6-hour Actions timeout.  
**Fix:** Add `signal: AbortSignal.timeout(15000)` to each `fetch` call in `post.ts`. Wrap each platform handler with a per-call timeout of ~15s.

---

### M-4 · Stripe checkout: `client_reference_id` not used — user linkage relies on metadata only
**File:** `cloudflare/worker/src/routes/billing.ts`, lines 620–686  
**Gap:** The checkout session does not set `client_reference_id`. User linkage back to the Heirloom DB record depends solely on `metadata[user_id]`. Stripe recommends using `client_reference_id` as the canonical customer reference because Stripe surfaces it in the dashboard and it is included in all webhook event types (including those that don't include the full metadata object, like some portal events).  
**Production impact:** Low risk today since the webhook handler reads from `metadata.user_id` which is reliably set. However, if Stripe strips custom metadata in a future policy change, or an event type without metadata is added, user linkage silently fails.  
**Fix:** Add `'client_reference_id': userIdStr` to the checkout session params alongside the existing metadata fields.

---

### M-5 · MS Graph token cache is module-level — leaks across Worker isolates in theory, but more critically: no TTL invalidation on auth failure
**File:** `cloudflare/worker/src/utils/email.ts`, lines 23–73  
**Gap:** `msGraphToken` is module-level. On auth failure (e.g., secret rotation), the cached token is marked expired only when `expiresAt < Date.now() + 300000` — but if the token is revoked by Azure before its natural expiry, the 5-minute buffer does not help. The code returns `null` from `getMsGraphToken` on fetch failure and falls back to Resend, so email delivery continues. However, the stale token keeps being attempted on every request for up to the full token TTL (typically 1 hour), generating one failed MS Graph call per email.  
**Production impact:** Extra MS Graph API call failures logged per email during the stale-token window (up to 1 hour after a secret rotation). Resend fallback means no delivery gap. Performance cost only.  
**Fix:** On `sendViaMsGraph` returning `{ success: false }` due to a 401, clear `msGraphToken = null` so the next call re-fetches.

---

## LOW

### L-1 · Bluesky: new session created on every post — no session reuse
**File:** `marketing/automation/src/post.ts`, lines 313–321  
**Gap:** `postBluesky` calls `createSession` on every invocation, creating a new JWT. For thread posts (multiple calls in a loop, lines 337–389), a single `accessJwt` is reused within the function, which is correct. But across the `Promise.all` in `run.ts` (line 114), if Bluesky appears in multiple platform variants, a session is created for each. This is a minor quota concern.  
**Production impact:** Bluesky rate-limits session creation to 300/day. With one daily post this is not an issue. Not a correctness problem.  
**Fix:** Extract a shared session-cache pattern similar to the MS Graph token cache if posting volume increases.

---

### L-2 · Pinata free-tier plan limits not enforced at the application layer
**File:** `cloudflare/worker/src/services/archive.ts`, lines 165–188  
**Gap:** The comment notes "Pinata Free: 1GB total, 100 pins/month" but the code does not check remaining quota before pinning. Pinata's free tier will return a 429 or 402 when quota is exhausted, which is handled as `{ ok: false }`. No alerting is wired for persistent pinning failures.  
**Production impact:** Silent pinning failures when quota is exhausted; IPFS continuity silently degrades. Because `verifyPins` marks them `FAILED`, an operator would see it in the audit dashboard — but only if they look.  
**Fix:** Add a `check_pinata_quota` step in the weekly cron that queries `https://api.pinata.cloud/data/userPinnedDataTotal` and alerts via email if over 80% used.

---

### L-3 · Founder pledge: `checkout_url` returned in API response is a one-time-use Stripe URL
**File:** `cloudflare/worker/src/routes/founders.ts`, lines 155–163  
**Gap:** The pledge endpoint returns `checkout_url` in the JSON response. The founder confirmation email (lines 136–153) does not include this URL — it says "we will be in touch within two business days with payment instructions." The Stripe checkout URL is single-use and expires in 24 hours by default. If the user closes the tab before completing checkout and expects to return via the confirmation email, they can't.  
**Production impact:** Founder conversion rate is harmed if the user navigates away from the checkout URL without bookmarking it.  
**Fix:** Include the `checkout_url` in the founder acknowledgement email that is sent immediately (line 137), so the user can return to it directly. Add a note that it expires in 24 hours.

---

## Summary table

| ID  | Severity | Area              | One-line description |
|-----|----------|-------------------|----------------------|
| C-1 | CRITICAL | Stripe billing    | No idempotency guard — duplicate webhook events send duplicate emails and re-process orders |
| C-2 | CRITICAL | Stripe billing    | `subscription.deleted` unconditionally downgrades Founder lifetime accounts |
| H-1 | HIGH     | Stripe billing    | Non-constant-time signature comparison — timing attack vector |
| H-2 | HIGH     | Marketing engine  | `preview` does not clear worker-queue creds — live posts on "dry run" |
| H-3 | HIGH     | IPFS archive      | Web3.Storage legacy API endpoint is sunset/dead |
| H-4 | HIGH     | IPFS archive      | `cloudflare-ipfs.com` gateway used for verification is shut down |
| H-5 | HIGH     | Push notifications| VAPID not configured — push delivery never happens despite UI opt-in |
| M-1 | MEDIUM   | Email             | Uncaught `sendEmail` in account-deletion route crashes response after DB write |
| M-2 | MEDIUM   | Email             | No send-rate deduplication — duplicate emails on repeated form submissions |
| M-3 | MEDIUM   | Marketing engine  | No timeout on platform `fetch` calls — cron can hang indefinitely |
| M-4 | MEDIUM   | Stripe billing    | `client_reference_id` not set on checkout session |
| M-5 | MEDIUM   | Email             | Stale MS Graph token not cleared on 401 — extra failed calls during secret rotation |
| L-1 | LOW      | Marketing engine  | Bluesky creates new session per post run |
| L-2 | LOW      | IPFS archive      | Pinata free-tier quota not checked; silent degradation at limit |
| L-3 | LOW      | Stripe / Founder  | Checkout URL not included in acknowledgement email — expires before user returns |
