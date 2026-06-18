-- 0069 — Widen the legacy_revisions entity_type CHECK to allow 'legacy_contact'.
--
-- WHY: 0040 created legacy_revisions with
--   entity_type TEXT NOT NULL CHECK (entity_type IN ('memory','letter','voice'))
-- to log append-only history for the memories/letters/voice surface. 0066 then
-- brought legacy_contacts under the same append-only constitution (soft-delete +
-- mutability window), and the worker now records a durable 'legacy_contact'
-- revision on contact edit/remove — but that value is forbidden by the 0040
-- CHECK, so every such INSERT 500s at the DB. SQLite cannot ALTER a CHECK
-- constraint in place, so rebuild the table with the widened value set,
-- preserving every column, type, NOT NULL, default, PK, and the entity index.
-- Nothing foreign-keys legacy_revisions(id), so the drop/rename is safe.
--
-- Column set + order = 0040 legacy_revisions VERBATIM (7 cols), so the
-- INSERT ... SELECT * below aligns positionally.

-- D1 runs each migration file inside its OWN implicit transaction, so this file
-- must NOT issue an explicit BEGIN/COMMIT (that throws "cannot start a
-- transaction within a transaction") and `foreign_keys=OFF` is a no-op inside
-- it. Match the table-rebuild idiom proven by 0039/0060: `defer_foreign_keys`
-- holds FK checks until the implicit commit so the drop/rename stays atomic.
PRAGMA defer_foreign_keys = true;

CREATE TABLE legacy_revisions_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('memory', 'letter', 'voice', 'legacy_contact')),
  entity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  -- JSON snapshot of the prior values. Fields that are encrypted at rest are
  -- snapshotted in their ciphertext form, so history is never plaintext-leaked.
  snapshot TEXT NOT NULL,
  -- 'edit' (within grace) | 'amendment' (after grace) | 'revoke' (soft-delete)
  reason TEXT NOT NULL DEFAULT 'edit',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO legacy_revisions_new SELECT * FROM legacy_revisions;

DROP TABLE legacy_revisions;

ALTER TABLE legacy_revisions_new RENAME TO legacy_revisions;

-- Recreate the per-table index that existed on the original (0040).
CREATE INDEX IF NOT EXISTS idx_legacy_revisions_entity
  ON legacy_revisions(entity_type, entity_id, created_at);
