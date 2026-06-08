# Heirloom Worker API — Bug & Logic Audit

Date: 2026-06-07  
Scope: `/cloudflare/worker/src/` — auth, billing, threads, memories, voice, inherit, letters.

---

## CRITICAL

### C-1 · Stripe webhook has no idempotency guard — duplicate events activate subscriptions twice
**File:** `routes/billing.ts` line 1098–1119 (`checkout.session.completed`)  
**Bug:** The webhook `checkout.session.completed` handler executes a raw `UPDATE subscriptions SET tier = ?, status = 'ACTIVE'` (or `INSERT`) with no check for whether this Stripe `session.id` has already been processed. Stripe delivers webhooks *at least once*; a network retry or Stripe replay will double-process the event, potentially overwriting a later `customer.subscription.deleted` (CANCELLED) back to ACTIVE, or creating duplicate subscription rows if the INSERT branch races.  
**Production failure:** A user who cancelled and whose event arrived in order `deleted → completed-retry` ends up with an ACTIVE paid subscription they should not have. Or, in rare cases, two ACTIVE subscription rows for the same user, causing `ORDER BY` logic in `/subscription` and `/limits` to return inconsistent results depending on timing.  
**Fix:** Add a `stripe_session_id` column to `subscriptions` (or a separate `processed_webhook_events` table) and guard every `checkout.session.completed` branch with `WHERE stripe_session_id IS NULL OR stripe_session_id != ?` before applying the update.

---

### C-2 · Stripe webhook: `checkout.session.completed` writes the raw `tier` string from attacker-controlled Stripe metadata without normalizing it
**File:** `routes/billing.ts` lines 1094–1118  
**Bug:** `const tier = session.metadata?.tier || 'STARTER'` is taken directly from Stripe checkout session metadata, which is set by the server at checkout creation but is also readable/writable in the Stripe Dashboard by anyone with API key access. More critically, `metadata` is passed verbatim from the client-supplied request body at `/checkout` (line 626–638). An attacker who crafts a checkout session via a direct Stripe API call (using a stolen or leaked publishable key or by intercepting a session URL) can set `metadata.tier = 'LEGACY'` and receive a LEGACY/Founder subscription for the price of a FAMILY plan. The tier is stored without calling `normalizeTier()`.  
**Production failure:** A paying user (or a malicious actor with a Stripe API key) could self-upgrade to LEGACY/Founder tier for the cost of $6.99/month.  
**Fix:** At the webhook, always resolve `tier` by looking up the Stripe subscription's `plan.amount` against the PRICING table rather than trusting `metadata.tier`; or at minimum call `normalizeTier()` on the value and verify it matches the amount actually charged.

---

### C-3 · `/api/inherit` is mounted on the **public** `app` — all recipient portal routes bypass JWT auth middleware
**File:** `index.ts` line 291 (`app.route('/api/inherit', inheritRoutes)`)  
**Bug:** `inheritRoutes` is registered on the public `app` instance, not on `protectedApp`. The `validateRecipientSession` inner middleware on the `/content/*` and `/search` and `/reply` routes does protect those specific sub-routes using a DB-stored session token. However, `GET /api/inherit/:token` — the token redemption endpoint that generates the session — has **no rate limiting and no brute-force protection**. Because Cloudflare KV/DO rate limiting is only applied to `/api/auth/*` paths (index.ts line 251), this endpoint is open to token enumeration attacks. A `crypto.randomUUID()` token has 122 bits of entropy, so brute-force is not practical today, but the deeper issue is that there is zero throttling on invalid token lookups.  
**Additionally** `inherit.ts` lines 219–250 (`GET /content/voice/:id`): the voice recording query is `WHERE v.id = ? AND v.user_id = ?` with **no `deleted_at IS NULL` filter**, so a soft-deleted voice recording is still served to legacy contacts.  
**Production failure:** Soft-deleted voice recordings are leaked to recipients via the inherit portal.  
**Fix:** Add `AND v.deleted_at IS NULL` to the voice query in `inherit.ts:230`; apply rate limiting middleware to `/api/inherit/:token`.

---

### C-4 · `/api/inherit/content/all` returns **all sealed letters for the owner** regardless of which recipient is asking — no per-recipient filtering
**File:** `routes/inherit.ts` lines 138–150  
**Bug:** The query is `WHERE l.user_id = ? AND l.sealed_at IS NOT NULL AND l.deleted_at IS NULL` with no join to `letter_recipients` or `legacy_contacts`. Every authenticated recipient session can read every sealed letter the owner ever wrote, regardless of who the letter was addressed to.  
**Production failure:** Legacy contact A can read a private sealed letter the owner wrote exclusively for legacy contact B (e.g., a will-adjacent personal note to a spouse, which the adult children were never meant to read).  
**Fix:** Join `letter_recipients` and filter by the `legacyContactId`'s email (matching `family_members.email`) before returning letters, mirroring the approach used in `letters.ts /received`.

---

### C-5 · `GET /api/inherit/content/letter/:id` also has no recipient scoping
**File:** `routes/inherit.ts` lines 184–216  
**Bug:** The query is `WHERE l.id = ? AND l.user_id = ? AND l.sealed_at IS NOT NULL` — any authenticated inherit session for the owner can fetch any sealed letter by guessing (or enumerating) the letter UUID, regardless of whether the letter was addressed to that specific legacy contact.  
**Production failure:** Same as C-4, but on a single-letter fetch endpoint.  
**Fix:** Add a join on `letter_recipients` filtered by the session's `legacyContactId`/email.

---

## HIGH

### H-1 · `POST /api/memories/file` upload does not enforce storage quota — only the metadata POST does
**File:** `routes/memories.ts` lines 197–240 (PUT handler) / 242–285 (POST handler)  
**Bug:** The `/upload/*` PUT and POST handlers write directly to R2 without calling `checkStorageQuota`. The quota check only happens later at `POST /api/memories/` (line 498–507) when the memory metadata row is created. A user can upload an arbitrarily large file to R2 via the upload handler, then abandon the metadata creation step. Alternatively, a user who has hit their storage cap can still successfully upload files to R2 — they just cannot create the DB row.  
**Production failure:** R2 storage is consumed beyond the tier cap without a billing remedy. For Free-tier users (500 MB cap) this is a cost-bleed for the service.  
**Fix:** Call `checkStorageQuota` in the upload handler (using the `Content-Length` header) before writing to R2, or enforce quotas at the R2 bucket level with signed upload policies.

### H-2 · `POST /api/voice` upload has the same quota gap as H-1
**File:** `routes/voice.ts` lines 113–191  
**Bug:** Same pattern — `/upload/*` writes to R2 without quota check; quota is only verified at `POST /api/voice/` (line 352–358).  
**Fix:** Same as H-1.

### H-3 · Voice storage quota query in `lib/quota.ts` does not filter soft-deleted rows
**File:** `lib/quota.ts` line 34  
**Bug:** `currentStorageBytes` queries `voice_recordings` without `AND deleted_at IS NULL`. Soft-deleted voice recordings still count toward the storage cap, so a user who deletes files to free up space will not see their used-bytes figure decrease. The memory query on line 33 correctly filters `AND deleted_at IS NULL`.  
**Production failure:** Users who delete large voice recordings cannot free up quota — they are permanently locked at their peak usage until an admin intervenes.  
**Fix:** Add `AND deleted_at IS NULL` to the voice_recordings query in `currentStorageBytes`.

### H-4 · `/api/auth/me` does not validate session in KV — only the JWT is verified
**File:** `routes/auth.ts` lines 420–421  
**Bug:** The `/me` endpoint calls `verifyJWT(token, c.env.JWT_SECRET)` but does **not** subsequently check `c.env.KV.get('session:' + payload.sessionId)`. This means a user whose session was explicitly invalidated (via logout, or password-reset session purge) can still call `/me` successfully with the old JWT until it expires (1 hour TTL). Compare with `lib/auth.ts:requireAuth` (line 36) and the `protectedApp` middleware (line 789) which both check KV. The `/me` handler is the one endpoint in `routes/auth.ts` that performs its own JWT verification and skips the KV check.  
**Production failure:** After `POST /api/auth/logout` or `POST /api/auth/reset-password` (which purges all sessions at line 584–586), the user's old JWT is still accepted by `/me` for up to 1 hour, exposing account details.  
**Fix:** Add `const session = await c.env.KV.get('session:' + payload.sessionId); if (!session) return c.json({ error: 'Session expired' }, 401);` after the JWT verification in the `/me` handler.

### H-5 · `PATCH /api/family/:id/restore` does not re-check ownership when clearing `deleted_at`
**File:** `routes/family.ts` lines 308–311  
**Bug:** The restore query is `UPDATE family_members SET deleted_at = NULL WHERE id = ?` using only `memberId`. The `SELECT` before it (lines 299–303) does check `user_id = ?`, but the subsequent UPDATE uses only `id`. Because D1 is a single-writer sequential DB this is not a TOCTOU race in the traditional sense, but it is a defense-in-depth gap: if the ownership check is ever refactored or the function is called programmatically without the guard, the update will blindly restore any member by ID.  
**Fix:** Change the UPDATE to `WHERE id = ? AND user_id = ?` binding both `memberId` and `userId`.

### H-6 · `customer.subscription.updated` webhook ignores tier and period changes — only syncs `cancel_at_period_end`
**File:** `routes/billing.ts` lines 1176–1197  
**Bug:** When Stripe fires `customer.subscription.updated` (which covers plan changes, renewals, and period updates), the handler only updates `cancel_at_period_end`. It does not update `tier`, `billing_cycle`, or `current_period_end`. A plan downgrade triggered from the Stripe Dashboard or Customer Portal will update Stripe's records but not the app's DB, leaving the user on the old (higher) tier indefinitely.  
**Production failure:** A user who downgrades via the Stripe Customer Portal retains their old tier access indefinitely because the DB is never updated.  
**Fix:** In the `customer.subscription.updated` handler, also read `subscription.items.data[0].price.metadata` (or re-check the amount against PRICING) and update `tier`, `billing_cycle`, and `current_period_end` in the DB.

---

## MEDIUM

### M-1 · `POST /api/threads/:id/members` checks the requester's subscription for the member limit — not the thread founder's
**File:** `routes/threads.ts` lines 222–235  
**Bug:** The member limit is fetched for `userId` (the person making the invite request). A FAMILY member (5-seat limit) who is a SUCCESSOR on a thread owned by a STARTER-tier user can invite beyond the STARTER limit by exploiting the fact that their own FAMILY tier gives them a 10-member limit.  
**Production failure:** Free (STARTER) users' threads can have more than 5 members if a paid-tier SUCCESSOR does the inviting, bypassing the advertised per-plan thread member cap.  
**Fix:** Fetch the subscription for `thread.founder_user_id` (available by joining `threads`) rather than the caller's `userId`.

### M-2 · `POST /api/threads/:id/entries` — time-locked entries with `visibility = 'FAMILY'` are immediately readable by all thread members
**File:** `routes/threads.ts` lines 471–519 (`GET /:id/entries`)  
**Bug:** When an entry has an unlock record (`entry_unlocks`), the entry's visibility is not suppressed in the read query. The `GET /entries` handler returns every row where `visibility_revoked_at IS NULL` and the member matches the visibility clause. There is a `pending_lock` sub-select (line 499) but it is returned as metadata only — it does not filter the entry out of the result set. A member can read the full `body_ciphertext` of a time-locked entry immediately.  
**Note:** Because entries are always E2E encrypted, a member without the `encrypted_key` from `entry_unlocks.encrypted_key` cannot decrypt the plaintext — the lock is enforced by the key, not the API. However, the metadata (title, era, tags) of locked entries is still returned, which may be unintended for a "sealed" entry.  
**Fix:** Add `AND NOT EXISTS (SELECT 1 FROM entry_unlocks eu WHERE eu.entry_id = e.id AND eu.resolved_at IS NULL)` to the visibility filter if the product intends to hide even metadata of locked entries; or document clearly that only the key is withheld, not the ciphertext envelope.

### M-3 · `POST /api/letters/:id/seal` creates `letter_deliveries` rows but `POST /:id/release` sends emails regardless of delivery status
**File:** `routes/letters.ts` lines 563–575 and 642–677  
**Bug:** `/seal` inserts `letter_deliveries` rows with `status = 'PENDING'`. `/release` re-fetches recipients from `family_members` via a fresh join on `letter_recipients` and sends emails to all of them, then updates `letter_deliveries` to `DELIVERED`. If a recipient's email changes between seal and release, the delivery goes to the new email, not the one recorded at seal time. More importantly, if `/release` is called twice (e.g., network retry), the second call will fail at `if (letter.delivered_at)` (line 629) and return a 400 — this is correct. However, if the first call partially fails (some emails sent, then an exception), the `letters.delivered_at` is only set at the very end (line 673), so a retry of `/release` will re-send emails to recipients who already received the letter.  
**Production failure:** Partial failures in `/release` cause duplicate email delivery to recipients.  
**Fix:** Move `UPDATE letters SET delivered_at = ?` to the beginning of the release handler (before the email loop) and check `delivered_at` per-recipient in `letter_deliveries` to skip already-sent records.

### M-4 · `POST /api/letters/:id/open` does not check that the milestone letter has been released (`delivered_at` can be null) — allowing pre-release reads
**File:** `routes/letters.ts` lines 695–759  
**Bug:** The `/open` query is:  
```sql
WHERE l.id = ? AND lower(fm.email) = lower(?) AND l.sealed_at IS NOT NULL AND l.deleted_at IS NULL
```  
There is no `AND l.delivered_at IS NOT NULL` or `AND l.delivery_trigger = 'IMMEDIATE'` guard. A recipient (matched by email) can call `/open` on a SCHEDULED milestone letter that has not yet been released by the author. The full `body` is returned at line 751.  
**Production failure:** Sealed milestone letters (birthday letters, graduation letters) are readable by the recipient before the author releases them, defeating the entire purpose of the feature.  
**Fix:** Add `AND (l.delivered_at IS NOT NULL OR l.delivery_trigger = 'IMMEDIATE')` to the `/open` query, or add a separate check before returning the body.

### M-5 · `GET /api/threads/:id/entries` — `PRIVATE` visibility entries authored by the current member are returned but `canRead` explicitly returns `false` for PRIVATE
**File:** `routes/threads.ts` lines 488–502  
**Bug:** The visibility SQL clause is:  
```
(visibility IN ('FAMILY', 'DESCENDANTS') OR author_member_id = ?)
```  
The `author_member_id = member.id` arm returns ALL entries the caller authored, including those with `visibility = 'PRIVATE'`. The comment at line 488 says "An author always sees their own entries — including ones they sealed for descendants (append-only)." However, `canRead()` at line 49 explicitly returns `false` for PRIVATE for all callers. So the SQL and the application-level check disagree — the SQL lets PRIVATE author entries through, which is presumably intentional (authors can always re-read what they wrote), but this is not documented and no re-check is done at the row level.  
This is primarily a documentation/latent-logic issue, but also means a PRIVATE entry's `body_ciphertext` + IV + auth_tag are returned to the author even though the product concept of a PRIVATE entry (from the schema) may mean "sealed for a specific recipient, not even readable by the author post-seal."  
**Fix:** Clarify intended semantics in a comment; if PRIVATE means "author cannot re-read after sealing," add `AND NOT (visibility = 'PRIVATE' AND author_member_id = ?)` or similar.

### M-6 · Family member count limit in `POST /api/family/` does not filter soft-deleted members
**File:** `routes/family.ts` lines 177–185  
**Bug:** `SELECT COUNT(*) as count FROM family_members WHERE user_id = ?` counts all rows including soft-deleted ones (`deleted_at IS NOT NULL`). A user who has added 2 family members (STARTER limit), soft-deleted one, and is still within the 7-day grace window will see `count = 2` and be blocked from adding a new member, even though one slot is effectively freed.  
**Production failure:** Users who delete a family member to free a slot cannot re-use that slot until the grace window expires and the cron purges the row.  
**Fix:** Add `AND deleted_at IS NULL` to the count query at line 179.

### M-7 · `GET /api/billing/usage` does not filter soft-deleted memories or voice recordings from the storage totals
**File:** `routes/billing.ts` lines 827–831  
**Bug:** Both queries — `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as size FROM memories WHERE user_id = ?` and the identical voice query — omit `AND deleted_at IS NULL`. Soft-deleted content's file_size continues to inflate the displayed usage figure.  
**Production failure:** Users who delete content to free storage see no reduction in the displayed usage percentage, causing unnecessary upgrade pressure. (The authoritative `checkStorageQuota` in `lib/quota.ts` correctly filters memories but, per H-3, incorrectly includes deleted voice recordings — so the bug is inconsistent across two surfaces.)  
**Fix:** Add `AND deleted_at IS NULL` to both queries in the `/usage` handler.

---

## LOW

### L-1 · `POST /api/auth/refresh` deletes the old refresh token before creating the new session — a failed `createSession` call leaves the user unable to refresh
**File:** `routes/auth.ts` lines 366–373  
**Bug:** `await c.env.KV.delete('refresh:' + refreshToken)` is called first (line 367), then `createSession` is called. If `createSession` throws (e.g., KV write timeout, D1 outage), the old refresh token is already gone and the new one was never written. The user must log in from scratch.  
**Fix:** Create the new session first, then delete the old refresh token.

### L-2 · `POST /api/threads/:id/entries` — the `mutable_until` timestamp is computed twice with potentially different millisecond values
**File:** `routes/threads.ts` lines 428 and 467  
**Bug:** `mutableUntil()` is called once when binding the INSERT (line 428) and again when constructing the JSON response (line 467). Both calls return `now + 30 days` but they are separate `new Date()` invocations, so they can differ by a few milliseconds if the response construction is slow (unlikely but non-deterministic).  
**Fix:** Compute `mutableUntil` once, store in a `const`, and use it in both places.

### L-3 · `DELETE /api/voice/:id/transcribe` — the transcribe endpoint does not check `deleted_at`
**File:** `routes/voice.ts` lines 519–527  
**Bug:** `POST /:id/transcribe` fetches the recording as `WHERE id = ? AND user_id = ?` without `AND deleted_at IS NULL`. A soft-deleted voice recording can still be transcribed, updating its transcript and `updated_at` fields after revocation.  
**Fix:** Add `AND deleted_at IS NULL` to the transcribe ownership check query.

### L-4 · `POST /api/auth/register` — if multiple vouchers exist for the same recipient email, only the earliest (LIMIT 1) is redeemed, but the others remain as 'PAID'/'SENT' indefinitely
**File:** `routes/auth.ts` lines 57–64  
**Bug:** `ORDER BY created_at ASC LIMIT 1` picks the oldest voucher. If a user was gifted two vouchers by different senders, only the first is redeemed on registration. The remaining vouchers stay in PAID/SENT status and are never invalidated or surfaced to the user.  
**Fix:** After redeeming the first voucher, mark all other pending vouchers for this email as `SUPERSEDED` (or log a warning) so they do not create confusion.

### L-5 · `POST /api/billing/checkout` — no duplicate active subscription guard; a user can create a second Stripe checkout and end up with two ACTIVE subscription rows
**File:** `routes/billing.ts` lines 548–686  
**Bug:** Before creating a Stripe checkout session, the code checks `if (!c.env.STRIPE_SECRET_KEY)` for a no-Stripe fallback that does check for an existing subscription (line 602). But the real Stripe path (line 620+) does not verify whether the user already has an active Stripe subscription. A user who opens two browser tabs, clicks "Subscribe" in both, and completes both checkouts will have two `checkout.session.completed` events. The first will INSERT or UPDATE the subscription; the second will UPDATE it again (idempotent for the current row state, but only if processed in order). If processed out of order, the `stripe_subscription_id` and `stripe_customer_id` stored will be from the second session, making the first Stripe subscription invisible to the cancel/portal flows.  
**Fix:** In the webhook handler, upsert on `stripe_subscription_id` to avoid orphaned Stripe subscriptions.

### L-6 · `PATCH /api/family/:id` COALESCE update cannot clear optional fields to NULL
**File:** `routes/family.ts` lines 240–251  
**Bug:** The UPDATE uses `COALESCE(?, field)` for all columns. If a user passes `email: null` or `phone: null` to explicitly clear a field, COALESCE returns the existing value and the field is not cleared.  
**Fix:** Use a conditional approach per field (or a JSON-patch style handler) so explicit `null` values are written as NULL rather than ignored.

### L-7 · `POST /api/inherit/reply` stores the `creator_user_id` from session context, but the `recipient_messages` `sender_email` is read from `legacy_contacts` which is not verified to belong to the current session's owner
**File:** `routes/inherit.ts` lines 436–438  
**Bug:** `legacyContactId` is taken from the session (set during token validation), so it is tied to a specific owner. But the query `SELECT name, email, relationship FROM legacy_contacts WHERE id = ?` does not verify `user_id = ownerId`. If somehow a session's `legacyContactId` was set to a contact belonging to a different owner (e.g., due to a data migration bug), the reply would be stored under the wrong sender identity.  
**Fix:** Add `AND user_id = ?` binding `ownerId` to the legacy_contacts lookup.

---

## Summary Table

| ID | Severity | File | Short description |
|----|----------|------|-------------------|
| C-1 | CRITICAL | billing.ts:1098 | No webhook idempotency — replay overwrites subscription state |
| C-2 | CRITICAL | billing.ts:1094 | Raw tier from Stripe metadata used without validation — LEGACY upgrade for $6.99 |
| C-3 | CRITICAL | index.ts:291 / inherit.ts:230 | Inherit portal is public; voice leak via missing deleted_at filter |
| C-4 | CRITICAL | inherit.ts:138 | All owner's sealed letters exposed to every legacy contact |
| C-5 | CRITICAL | inherit.ts:184 | Per-letter endpoint has no recipient scoping |
| H-1 | HIGH | memories.ts:197 | File upload bypasses storage quota check |
| H-2 | HIGH | voice.ts:113 | Voice upload bypasses storage quota check |
| H-3 | HIGH | lib/quota.ts:34 | Soft-deleted voice not excluded from quota — frees no space on delete |
| H-4 | HIGH | routes/auth.ts:420 | `/me` skips KV session validation — logged-out tokens still work for 1h |
| H-5 | HIGH | routes/billing.ts:1176 | `subscription.updated` webhook ignores tier/period — downgrades never applied |
| M-1 | MEDIUM | threads.ts:222 | Member invite limit checked against inviter's tier, not thread founder's |
| M-2 | MEDIUM | threads.ts:471 | Time-locked entry ciphertext returned to members despite pending lock |
| M-3 | MEDIUM | letters.ts:642 | Partial release failure causes duplicate email delivery on retry |
| M-4 | MEDIUM | letters.ts:695 | Recipient can read sealed milestone letter before author releases it |
| M-5 | MEDIUM | threads.ts:488 | PRIVATE entry visibility semantics inconsistent between SQL and canRead() |
| M-6 | MEDIUM | family.ts:177 | Soft-deleted members counted in plan limit — freed slots not immediately usable |
| M-7 | MEDIUM | billing.ts:827 | `/usage` includes soft-deleted file sizes in storage display |
| L-1 | LOW | auth.ts:366 | Refresh token deleted before new session created — outage = lockout |
| L-2 | LOW | threads.ts:428,467 | mutable_until computed twice with different timestamps |
| L-3 | LOW | voice.ts:519 | Transcribe endpoint operates on soft-deleted recordings |
| L-4 | LOW | auth.ts:57 | Extra pending vouchers not invalidated on registration |
| L-5 | LOW | billing.ts:548 | No duplicate checkout guard — two sessions can create orphaned Stripe subscription |
| L-6 | LOW | family.ts:240 | COALESCE update cannot explicitly clear optional fields to NULL |
| L-7 | LOW | inherit.ts:436 | legacy_contacts lookup not scoped to session's ownerId |
