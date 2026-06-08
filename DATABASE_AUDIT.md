# Heirloom D1 Database Audit

**Date:** 2026-06-07  
**Migrations reviewed:** 0001–0052  
**Routes reviewed:** memories.ts, voice.ts, threads.ts, billing.ts, lib/quota.ts

---

## Migration numbering

52 files, sequential 0001–0052, no gaps. Clean.

---

## CRITICAL

### C1 — Hard DELETE in routes/index.ts stubs bypasses soft-delete (unreachable in prod but still a live file)

`cloudflare/worker/src/routes/index.ts` line 181–183 and 261–263 contain:

```sql
DELETE FROM memories WHERE id = ? AND user_id = ?
DELETE FROM letters WHERE id = ? AND user_id = ?
```

These are stub routes. The worker entry point (`src/index.ts` line 14) explicitly notes it imports from individual files, not `routes/index.ts`. The stubs are **not currently mounted**. However, the file exists and is importable. If any future refactor accidentally imports from it, those hard-DELETEs would silently destroy rows that should be soft-deleted, bypassing the append-only guarantee and the revision log. The stubs also lack quota checks, ownership validation, and R2 cleanup. This file should be deleted or the hard-DELETE routes removed.

**File:** `/Users/reshigan/Heirloom/cloudflare/worker/src/routes/index.ts`  
**Risk if reactivated:** Permanent, irrecoverable data loss — contradicts the entire append-only constitution.

---

### C2 — `routes/index.ts` family member DELETE is a hard DELETE (also unreachable but dangerous)

Line 76: `DELETE FROM family_members WHERE id = ? AND user_id = ?` — same file, same risk. The real `family.ts` route should soft-delete via `deleted_at`, but `index.ts` would hard-delete, cascading to `memory_recipients`, `letter_recipients`, `voice_recipients` (ON DELETE CASCADE) and breaking all recipient links for that family member.

---

## HIGH

### H1 — Voice quota does not filter soft-deleted rows (confirmed bug)

**File:** `/Users/reshigan/Heirloom/cloudflare/worker/src/lib/quota.ts` lines 33–37

```ts
env.DB.prepare(
  `SELECT COALESCE(SUM(file_size), 0) AS total FROM voice_recordings WHERE user_id = ?`,
).bind(userId).first<{ total: number }>(),
```

No `AND deleted_at IS NULL` filter. Soft-deleted voice recordings continue to count against the user's storage quota. A user who soft-deletes large recordings will never reclaim quota headroom. The memories query on the same line correctly filters `AND deleted_at IS NULL`. This is the bug called out in the audit spec.

**Fix:** Add `AND deleted_at IS NULL` to the voice query in `currentStorageBytes`.

---

### H2 — `billing.ts` /limits and /usage queries count soft-deleted rows

Lines 443–445 (`/limits`) and 827–829 (`/usage`):

```sql
SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total FROM memories WHERE user_id = ?
SELECT COUNT(*) as count, ... FROM voice_recordings WHERE user_id = ?
SELECT COUNT(*) as count FROM letters WHERE user_id = ?
```

None filter `deleted_at IS NULL`. The usage display shown to the user will be inflated after any soft-deletion, and storage percentage warnings can fire incorrectly. This also means the `/limits` endpoint can report `full: true` for a user who has deleted all their content.

---

### H3 — `subscriptions.trial_ends_at` and `status` not indexed; queried on every authenticated API call

Every billing gate (quota check, subscription check, limits) queries:

```sql
SELECT tier, status, trial_ends_at FROM subscriptions WHERE user_id = ?
ORDER BY CASE status WHEN 'ACTIVE' THEN 0 ...
```

`idx_subscriptions_user` (added in 0032) indexes `user_id`, so the row lookup is fast. However `status` and `trial_ends_at` are not indexed and appear in ORDER BY expressions evaluated after the lookup. At current scale (one row per user) this is fine. For the webhook path `WHERE stripe_subscription_id = ?`, the column is UNIQUE (auto-indexed by SQLite), so that's also fine.

The actual gap: **`checkStorageQuota` in quota.ts always queries subscriptions with `ORDER BY created_at DESC LIMIT 1`** on a table where `user_id` is UNIQUE — so this ORDER BY is always a no-op single-row scan. No index needed there.

**Actual concern:** `billing.ts` /subscription and /limits both use an ORDER BY CASE expression with no index support. Not critical today, but worth noting.

---

### H4 — N+1 query in `voice.ts` GET / (list all recordings)

Lines 27–55: the list endpoint fetches all recordings for a user (up to 100), then for **each recording** issues a separate query to `voice_recipients` + `family_members`:

```ts
const recordingsWithRecipients = await Promise.all(
  recordings.results.map(async (recording: any) => {
    const recipients = await c.env.DB.prepare(`
      SELECT fm.id, fm.name, fm.relationship FROM family_members fm
      JOIN voice_recipients vr ON fm.id = vr.family_member_id
      WHERE vr.voice_recording_id = ?
    `).bind(recording.id).all();
    ...
  })
);
```

With a page size of 100, this is 101 round trips to D1 per request. D1 charges per query and has per-worker CPU limits. D1's `.batch()` API should be used instead, or a single JOIN query with `GROUP_CONCAT` / `json_group_array`.

**File:** `/Users/reshigan/Heirloom/cloudflare/worker/src/routes/voice.ts` lines 27–55

---

### H5 — Search endpoint pulls unbounded result set into memory before slicing

`GET /api/memories/search` (memories.ts lines 374–435): when `type=all`, it fires **three unbounded SQL queries** (no LIMIT), pulls all matching rows into the Worker's heap, scores them in JS, then slices to the configured limit (max 50). A user with thousands of entries and a short common-word query (`the`, `my`, `at`) will return tens of thousands of rows across three tables into memory before a single item is shown.

SQLite LIKE with a leading `%` (as used here: `%<term>%`) cannot use any index — it is always a full table scan on the filtered `user_id` partition. At current scale this is slow but survivable. At family-archive scale (thousands of entries per user) this will OOM the Worker or hit the 30ms CPU budget.

**Fix:** Add `LIMIT <2×requested_limit>` to each subquery, or use SQLite FTS5 (migration 0012 adds `memory_search` — check if it's wired up to these queries).

---

## MEDIUM

### M1 — `deleted_at` on `letters` and `voice_recordings` has no index

Migration 0040 added `deleted_at` to `letters` and `voice_recordings`. Migration 0045 added `idx_memories_deleted ON memories(user_id, deleted_at)`. But no equivalent index was added for letters or voice_recordings.

Every `WHERE user_id = ? AND deleted_at IS NULL` query on those tables (e.g., `letters.ts`, `voice.ts` list/stats) will scan all rows for the user rather than using a covering index. Fine today, painful at scale.

**Missing indexes:**
```sql
CREATE INDEX idx_letters_deleted ON letters(user_id, deleted_at);
CREATE INDEX idx_voice_deleted ON voice_recordings(user_id, deleted_at);
```

---

### M2 — `family_members.deleted_at` has no index

Migration 0043 added `deleted_at` to `family_members`, but no index was created. Any route that filters active family members by `AND deleted_at IS NULL` will full-scan per user. The column is new; routes in `family.ts` may not yet filter on it at all (not audited here), which is a separate correctness gap.

---

### M3 — `billing.ts` /limits and /usage count soft-deleted items in display counts (not just storage)

Lines 443, 445: `COUNT(*) ... FROM memories WHERE user_id = ?` without `deleted_at IS NULL` means the dashboard will tell a user they have N memories when they have actually revoked some. This inflates displayed counts in the settings/usage screen, which could cause user confusion or support tickets.

---

### M4 — Voice recipients added via sequential loop, not batch

`voice.ts` POST `/` lines 391–395:

```ts
for (const recipientId of recipientIds) {
  await c.env.DB.prepare(`INSERT INTO voice_recipients ...`).bind(...).run();
}
```

Each iteration is a separate D1 write round-trip. `memories.ts` POST correctly uses `c.env.DB.batch(...)` for the same operation. Voice should do the same.

---

### M5 — `subscriptions` table rebuilt in 0052 but `idx_subscriptions_user` not recreated

Migration 0052 drops and recreates `subscriptions`, but only recreates `idx_subscriptions_stripe`. The `idx_subscriptions_user` index added in 0032 is silently lost. All `WHERE user_id = ?` queries on subscriptions now full-scan (one row per user today, so the cost is near zero, but the index should be restored for correctness).

**Fix:**
```sql
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
```
in a new migration.

---

### M6 — `family_members` GET / in `index.ts` stubs (unreachable) has no `deleted_at IS NULL` filter

Line 19 in `routes/index.ts`: `SELECT * FROM family_members WHERE user_id = ? ORDER BY name` — no soft-delete filter. The real `family.ts` must be verified to filter correctly; if it doesn't, soft-deleted family members appear in the family list and can receive new memory assignments.

---

## LOW

### L1 — Subscription CHECK constraint mismatch (fixed in 0052, but worth noting how it was discovered)

Migration 0052 comment documents that `tier='STARTER'`, `tier='FOREVER'`, `status='EXPIRED'`, and `status='CANCELED'` (one-L) had been silently dropping subscription writes with a CHECK violation since 0001. This was a silent data loss bug in production (every Stripe `subscription.deleted` webhook was failing). Fixed. Future new tiers/statuses should update 0052's CHECK list before being written from routes.

---

### L2 — `search` in memories.ts does not decrypt `description_enc`

When a memory's description is encrypted at rest (`description_enc IS NOT NULL`, `description IS NULL` per 0040 design), the search query `SELECT description FROM memories` will get NULL back and the search will not match prose content. This is expected for security but means encrypted memories are only searchable by title. Not a bug per se, but a known functional gap that should be documented in the FTS migration (0012).

---

### L3 — `story_prompts` seed data uses decorative emoji

`0001_initial.sql` lines 346–355 insert prompts with emoji (`👶`, `🎮`, `🎄`, etc.). The ART_DIRECTION.md bans decorative emoji. These are only in `story_prompts` (deprecated by `starter_prompts` in 0036), so they're low priority, but a cleanup migration should NULL out the `emoji` column.

---

### L4 — `sessions.expires_at` index added late

`idx_sessions_expires ON sessions(expires_at)` was added in 0032, not in 0001. Session cleanup cron queries benefit from this, but any sessions written between 0001 and 0032 were scanned without it. No action needed; just a historical note.

---

## Index gap summary

| Table | Missing index | Impact |
|---|---|---|
| `subscriptions` | `user_id` (dropped by 0052 rebuild) | Every billing check |
| `letters` | `(user_id, deleted_at)` | All letter list/stats queries |
| `voice_recordings` | `(user_id, deleted_at)` | All voice list/stats queries |
| `family_members` | `(user_id, deleted_at)` | Family list filtering |

---

## Fixes in priority order

1. **quota.ts** — add `AND deleted_at IS NULL` to voice query (H1, one-line fix)
2. **billing.ts /limits + /usage** — add `AND deleted_at IS NULL` to all three count/sum queries (H2, three-line fix)
3. **New migration 0053** — recreate `idx_subscriptions_user`; add `idx_letters_deleted`, `idx_voice_deleted`, `idx_family_deleted` (M1, M2, M5)
4. **voice.ts POST** — replace recipient loop with `DB.batch()` (M4, follows memories.ts pattern)
5. **Search queries** — add LIMIT to each subquery, cap result fan-in (H5)
6. **routes/index.ts** — delete the file entirely, or replace hard-DELETEs with soft-delete stubs (C1, C2)
