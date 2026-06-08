# Heirloom Cloudflare Worker — Security Audit

**Date:** 2026-06-07  
**Scope:** `cloudflare/worker/src/` — all route files and index.ts  
**Auditor:** Claude (automated pass; treat as a first-pass, not a pen-test)

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 2 |
| LOW | 2 |

---

## CRITICAL

### C1 — Unauthenticated admin endpoint leaks encryption adoption stats

**File:** `routes/encryption.ts` lines 628–691  
**Route:** `GET /api/encryption/admin/stats` (mounted on `protectedApp`)

The route requires a valid user JWT (via protectedApp middleware) but has **no admin role check**. Any authenticated user can call it and receive a count of all users, how many have encryption enabled, their escrow configurations, and Shamir share counts.

The comment on line 630 reads: `// Note: This should be protected by admin auth middleware in production`

This is not admin-protected. Every logged-in Heirloom user can reach it.

**Impact:** Internal user stats disclosed to all ~N authenticated users; not a data breach on its own, but exposes platform internals.

**Fix:** Add `adminAuth` middleware or at minimum check that `c.get('userId')` is in `admin_users`.

---

### C2 — Admin first-login bypass: any password accepted for new admins

**File:** `routes/admin.ts` lines 84–113  
**Route:** `POST /api/admin/login`

When a new admin account is created (`POST /api/admin/admin-users`), the password is stored as the literal string `CHANGE_ME_ON_FIRST_LOGIN:`. On the next login attempt the code detects this sentinel and **sets the DB password to whatever password the caller supplied** — with no verification, no email confirmation, and no prior credential required.

```ts
// line 84
if (storedHash === 'CHANGE_ME_ON_FIRST_LOGIN' || passwordHashStr === 'CHANGE_ME_ON_FIRST_LOGIN') {
  // First login - set the password
  // ...stores submitted password as the new hash with no checks...
}
```

Any attacker who learns a new admin's email address (e.g. from a leaked admin-user list, a registration notification, or social engineering) can POST to `/api/admin/login` with that email and any chosen password and immediately own that admin account — bypassing all authentication. This is a full admin authentication bypass for any newly created admin user before they perform their first login.

**Impact:** CRITICAL — full admin compromise (access to all user data, bulk email, subscription manipulation, user deletion).

**Fix:** Require a one-time setup token sent to the admin's email on account creation. Do not allow any password to be accepted just because the stored hash is a sentinel. At minimum, require the existing super-admin to pre-set a temporary password and force a change via a signed link.

---

## HIGH

### H1 — Inherit `/content/all` exposes ALL sealed letters to any verified legacy contact — not scoped to recipient

**File:** `routes/inherit.ts` lines 127–181  
**Route:** `GET /api/inherit/content/all`

The letters query (line 138–150) returns **every sealed letter written by `ownerId`**, regardless of which legacy contact is viewing. There is no join to `letter_recipients` to scope results to the authenticated legacy contact:

```sql
SELECT l.id, l.title, l.salutation, l.body, ...
FROM letters l
WHERE l.user_id = ? AND l.sealed_at IS NOT NULL AND l.deleted_at IS NULL
```

A deceased user who wrote 10 letters each addressed to a different family member: every one of those 10 legacy contacts can read all 10 letters, including ones explicitly addressed to siblings, a spouse, or children — not them.

The in-code comment (line 153–157) acknowledges the memory/voice issue but does not flag the letter scoping problem:

> "Memories and voice recordings do not have a per-recipient column… so returning them for every recipient would expose ALL of the owner's content"

The same logic applies to letters. Letters have a `letter_recipients` junction table that is **not consulted** here.

**Impact:** Cross-recipient letter exposure — legacy contact A reads letters intended for legacy contact B. For a product whose core promise is personal last messages, this is a significant breach of user expectation and privacy.

**Fix:** Join `letter_recipients` in the query:
```sql
SELECT l.id, l.title, l.salutation, l.body, ...
FROM letters l
JOIN letter_recipients lr ON lr.letter_id = l.id
JOIN family_members fm ON fm.id = lr.family_member_id
JOIN legacy_contacts lc ON LOWER(lc.email) = LOWER(fm.email)
WHERE l.user_id = ? 
  AND l.sealed_at IS NOT NULL 
  AND l.deleted_at IS NULL
  AND lc.id = ?   -- the session's legacyContactId
```

The single-letter endpoint `GET /api/inherit/content/letter/:id` (line 184–215) has the same defect: it only checks `l.user_id = ?` and not that the requesting legacy contact is a recipient.

---

### H2 — Voice file endpoint on the protected app has no ownership check (legacy route still live)

**File:** `routes/voice.ts` lines 196–289  
**Route:** `GET /api/voice/file/*` (mounted under `protectedApp`)

This route handler requires a valid JWT (comes in through `protectedApp`) but **does not verify that the requested file key belongs to the authenticated user**. It fetches any R2 object at any `voice/` path:

```ts
// line 202-203
const key = decodeURIComponent(pathAfterFile);
// No ownership check before:
const headObject = await c.env.STORAGE.head(key);
```

The comment on line 193 says "Note: This route is also defined in index.ts as a public route. This one is kept for backwards compatibility." The `index.ts` version (lines 577–697) **does** check `WHERE file_key = ? AND user_id = ?`. Because both handlers are mounted, Hono will match `index.ts`'s handler first for `GET /api/voice/file/*` since it is registered before `protectedApp` is mounted. However, the route in `voice.ts` is also reachable via `protectedApp` at `/api/voice/file/*` and, depending on Hono's routing order, could shadow or supplement the secure handler.

More concretely: the unauthenticated `GET /api/voice/file/*` handler inside `voice.ts` is mounted on `protectedApp` (which requires JWT), but once past the JWT check it fetches **any** R2 key under `voice/` with no user-ownership constraint. An authenticated user who guesses another user's `file_key` (UUID-based, but still) can stream their audio.

**Impact:** Any authenticated user can stream other users' voice recordings by brute-forcing or guessing UUIDs.

**Fix:** Remove the legacy route from `voice.ts` entirely. The secure version in `index.ts` is the canonical handler.

---

### H3 — Admin login password hash parsing is fragile and could bypass verification

**File:** `routes/admin.ts` lines 79–82

The password format is `hash:salt` (colon-separated). The code finds the colon with:
```ts
const colonIndex = passwordHashStr.indexOf(':');
const storedHash = colonIndex >= 0 ? passwordHashStr.substring(0, colonIndex) : passwordHashStr;
const storedSalt = colonIndex >= 0 ? passwordHashStr.substring(colonIndex + 1) : null;
```

If an attacker could write an admin `password_hash` column value containing no colon (e.g. `""` or a single word), `storedSalt` becomes `null` and the code returns `401` at line 116 (`if (!storedSalt) return 401`). This is the correct behavior.

However, there is a second class of issue: the hash comparison on line 140 is **not constant-time**:
```ts
if (hash !== storedHash) {
```

JavaScript string `!==` short-circuits on the first differing character, enabling a timing oracle for the admin password hash. Combined with knowledge of the PBKDF2 parameters (100k iterations, SHA-256, 256-bit output), this is theoretically exploitable with many requests but is largely mitigated by Cloudflare's edge latency variance. Raised as HIGH because admin credentials are the highest-value target.

**Fix:** Use `crypto.subtle.timingSafeEqual` (available in Cloudflare Workers via Web Crypto) for the hash comparison, as is already done correctly in `auth.ts` (`verifyPassword`).

---

## MEDIUM

### M1 — No input length limits on register/login body fields

**File:** `routes/auth.ts` lines 17–219

The `POST /api/auth/register` and `POST /api/auth/login` endpoints accept unbounded `firstName`, `lastName`, `password`, and `email` fields. `password` is run through PBKDF2 at 100,000 iterations. Sending a 1 MB password string will max out the Worker CPU budget and trigger a 503.

The per-IP rate limiter (10 req/min) provides partial mitigation — an attacker needs 10 requests per IP to cause pain — but this is still an easy way to slow the auth service from distributed IPs.

**Note:** This was excluded from the strict scope (no DOS findings) but is raised as MEDIUM because the PBKDF2 call on unbounded input also has a correctness risk: Web Crypto's PBKDF2 does not guarantee performance for very large inputs across all Worker runtimes.

**Fix:** Cap `password` at 1024 bytes and other fields at reasonable limits (e.g. 254 chars for email) before any crypto operation.

---

### M2 — Inherit `/:token` route is mounted on the public app with no expiry/replay check on the session itself

**File:** `routes/inherit.ts` lines 13–89  
**Route:** `GET /api/inherit/:token`

The verification token is correctly checked for expiry. However, the `recipient_sessions` table row is created every time the token endpoint is hit (even after `verified_at` is set), generating a new `sessionToken` each time. There is no limit on how many active sessions a single verification token can spawn, and sessions last 24 hours.

A more significant issue: the `validateRecipientSession` middleware (line 93–124) does not verify that the session's `owner_id` and `legacy_contact_id` match the route being accessed. In the current code all protected inherit routes only use `ownerId`/`legacyContactId` from the session, so this is not directly exploitable. But it means a session from one verification token is structurally interchangeable with any other session — if the same legacy contact has multiple verifications (e.g. from multiple dead-man triggers), they are not scoped separately.

**Fix:** Track session count per verification token and cap it (e.g. max 3 simultaneous sessions). Not a critical fix, but closes a session proliferation vector.

---

## LOW

### L1 — `/api/voice/file/*` in voice.ts sets `Access-Control-Allow-Origin: *`

**File:** `routes/voice.ts` line 241

The legacy voice file handler sets:
```ts
headers.set('Access-Control-Allow-Origin', '*');
```

This means any web page can make cross-origin requests to this audio endpoint and read the response. Combined with H2 (no ownership check), this allows any website to serve another user's private voice recordings if they can guess the file key. Even after H2 is fixed, a wildcard ACAO header on a private file endpoint is inappropriate.

**Fix:** Remove this header from the legacy route (or remove the route entirely per H2's fix). The secure `index.ts` handler sets `Cross-Origin-Resource-Policy: cross-origin` without a wildcard ACAO.

---

### L2 — Error handler leaks stack traces in development mode

**File:** `index.ts` lines 853–871

```ts
if (c.env.ENVIRONMENT === 'development') {
  body.debug = err.message;
}
```

This is intentional and gated on `ENVIRONMENT === 'development'`. It is correctly disabled in production. No action required, noted for completeness.

---

## Findings by Area (Quick Reference)

| Area | Finding | Status |
|---|---|---|
| Rate limiting on auth | Present — 10 req/min per IP, Durable Object, fail-closed | OK |
| Account enumeration (login) | Uses identical error for wrong email vs wrong password (`'Invalid email or password'`) | OK |
| Account enumeration (forgot-password) | Returns identical message regardless of whether email exists | OK |
| IDOR — memories GET/PATCH/DELETE | All query with `user_id = ?` | OK |
| IDOR — letters GET/PATCH/DELETE | All query with `user_id = ?` | OK |
| IDOR — voice GET/PATCH/DELETE | All query with `user_id = ?` | OK |
| IDOR — inherit letters (content/all) | **No recipient scoping — exposes all owner's letters to any legacy contact** | **HIGH (H1)** |
| Input validation — memories POST | Body fields mostly unvalidated for length; queries parameterized | MEDIUM (M1) |
| SQL injection | All queries use `?` placeholders / D1's `.bind()` | OK |
| `/me` endpoint — sensitive field exposure | Returns only safe fields; no password_hash, no stripe_customer_id | OK |
| Error handler — stack traces | Dev-only; gated on ENVIRONMENT flag | OK |
| CORS | Allowlist of 3 origins; returns `null` for unknown origins | OK |
| Admin route guards | `adminAuth` middleware on all routes except `POST /login`; admin login is public (intentional) | OK (but see C2) |
| Hardcoded secrets | None found | OK |
| Inherit route ordering | Routes mounted on public `app` (no JWT required) — consistent with design: tokens are the auth | OK |
| Admin `/admin/stats` encryption route | No admin check — any authenticated user can access | **CRITICAL (C1)** |
| Admin first-login bypass | Any password accepted for `CHANGE_ME_ON_FIRST_LOGIN` accounts | **CRITICAL (C2)** |

---

## Recommended Fix Priority

1. **C2** — Admin first-login bypass: block immediately; any newly created admin is exploitable until they log in.
2. **H1** — Inherit letter scoping: fix before launch; core user trust violation.
3. **C1** — Encryption admin stats: add role check (one line).
4. **H2** — Remove legacy voice file route from `voice.ts`.
5. **H3** — Replace `hash !== storedHash` with constant-time comparison in admin login.
6. **L1** — Remove wildcard ACAO from legacy voice route.
