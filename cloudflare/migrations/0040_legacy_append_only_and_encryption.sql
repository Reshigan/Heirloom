-- 0040 — Bring the legacy memories/letters/voice surface in line with the
-- append-only constitution, and encrypt legacy memory descriptions at rest.
--
-- WHY: the Family Thread (0036) is already append-only + encrypted, but the
-- pre-Thread memories/letters/voice endpoints still hard-deleted rows (and the
-- R2 file) and overwrote edits in place — silent, irreversible data loss that
-- contradicts "perpetual, append-only … never lose a thread." This migration
-- gives those tables the same guarantees:
--   * soft-delete (deleted_at) instead of DELETE FROM — the row + file survive;
--     "remove" just hides the item from reads. True erasure remains only at the
--     account level (DELETE /settings/account) for GDPR.
--   * a 30-day mutability grace window (mutable_until); after it, edits are
--     recorded as amendments rather than silent overwrites.
--   * an append-only revision log (legacy_revisions) so every prior version is
--     preserved.
--   * server-side at-rest encryption of memory `description` (the sensitive
--     prose) via the worker's ENCRYPTION_MASTER_KEY. Ciphertext lives in
--     description_enc/description_iv; the base `description` is set NULL for
--     encrypted rows so the external-content FTS index never holds ciphertext
--     and `title` stays searchable.

-- ── Append-only: soft-delete + mutability window ────────────────────────────
ALTER TABLE memories ADD COLUMN deleted_at TEXT;
ALTER TABLE memories ADD COLUMN deleted_reason TEXT;
ALTER TABLE memories ADD COLUMN mutable_until TEXT;

ALTER TABLE letters ADD COLUMN deleted_at TEXT;
ALTER TABLE letters ADD COLUMN deleted_reason TEXT;
ALTER TABLE letters ADD COLUMN mutable_until TEXT;

ALTER TABLE voice_recordings ADD COLUMN deleted_at TEXT;
ALTER TABLE voice_recordings ADD COLUMN deleted_reason TEXT;
ALTER TABLE voice_recordings ADD COLUMN mutable_until TEXT;

-- ── At-rest encryption of memory descriptions (server envelope) ─────────────
-- description_enc = base64(AES-256-GCM ciphertext incl. tag); description_iv =
-- base64(12-byte IV). When description_enc IS NOT NULL the base `description`
-- column is NULL (so FTS indexes nothing for it).
ALTER TABLE memories ADD COLUMN description_enc TEXT;
ALTER TABLE memories ADD COLUMN description_iv TEXT;

-- ── Append-only revision history (polymorphic) ──────────────────────────────
CREATE TABLE IF NOT EXISTS legacy_revisions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('memory', 'letter', 'voice')),
  entity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  -- JSON snapshot of the prior values. Fields that are encrypted at rest are
  -- snapshotted in their ciphertext form, so history is never plaintext-leaked.
  snapshot TEXT NOT NULL,
  -- 'edit' (within grace) | 'amendment' (after grace) | 'revoke' (soft-delete)
  reason TEXT NOT NULL DEFAULT 'edit',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_legacy_revisions_entity
  ON legacy_revisions(entity_type, entity_id, created_at);

-- ── Backfill the grace window for existing rows (30 days from creation) ──────
UPDATE memories         SET mutable_until = datetime(created_at, '+30 days') WHERE mutable_until IS NULL;
UPDATE letters          SET mutable_until = datetime(created_at, '+30 days') WHERE mutable_until IS NULL;
UPDATE voice_recordings SET mutable_until = datetime(created_at, '+30 days') WHERE mutable_until IS NULL;

-- NOTE: encrypting EXISTING plaintext descriptions can't be done in SQL — it
-- runs as a batched backfill in the worker (crons/legacy-encryption-backfill),
-- which moves description → description_enc/iv and NULLs the plaintext column.
