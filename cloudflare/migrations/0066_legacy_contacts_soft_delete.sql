-- 0066 — Bring legacy_contacts in line with the append-only constitution.
--
-- WHY: legacy_contacts (the bloodline's named recipients / dead-man-switch
-- beneficiaries) still hard-deleted rows on "remove", which silently severs the
-- switch_verifications + key_escrows that reference them — irreversible loss
-- that contradicts "perpetual, append-only … never lose a thread." This gives
-- the table the same soft-delete + mutability guarantees 0040 established for
-- the memories/letters/voice surface:
--   * soft-delete (deleted_at) instead of DELETE FROM — the row survives and
--     "remove" just hides the contact from reads.
--   * deleted_reason records why ('revoke' | 'amendment' | …).
--   * a 30-day mutability grace window (mutable_until); after it, edits are
--     recorded as amendments rather than silent overwrites.

ALTER TABLE legacy_contacts ADD COLUMN deleted_at TEXT;     -- ISO 8601; NULL = active
ALTER TABLE legacy_contacts ADD COLUMN deleted_reason TEXT;
ALTER TABLE legacy_contacts ADD COLUMN mutable_until TEXT;

-- Backfill the grace window for existing rows (30 days from creation).
UPDATE legacy_contacts SET mutable_until = datetime(created_at, '+30 days') WHERE mutable_until IS NULL;
