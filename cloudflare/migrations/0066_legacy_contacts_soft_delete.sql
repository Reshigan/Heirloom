-- 0066 — Bring legacy_contacts in line with the append-only constitution.
--
-- WHY: legacy_contacts (the bloodline's named recipients / dead-man-switch
-- beneficiaries) still hard-deleted rows on "remove", which silently severs
-- every table that REFERENCES legacy_contacts(id) ON DELETE CASCADE —
-- shamir_shares (0010), letter/memory/voice_legacy_recipients (0054, 0064),
-- recipient_sessions (0007) and switch_verifications (0001) — irreversible loss
-- that contradicts "perpetual, append-only … never lose a thread." (Note:
-- key_escrows is NOT cascaded — 0006 adds only a plain trusted_contact_id TEXT
-- column with no REFERENCES, so it is unaffected either way.) This gives the
-- table the same soft-delete + mutability guarantees 0040 established for the
-- memories/letters/voice surface:
--   * soft-delete (deleted_at) instead of DELETE FROM — the row survives and
--     "remove" just hides the contact from reads.
--   * deleted_reason records why ('removed' | …).
--   * a 7-day restore grace window enforced in the worker
--     (settings.ts /legacy-contacts/:id/restore); a soft-deleted contact can be
--     un-deleted within 7 days. mutable_until additionally records the in-place
--     edit window; after it, edits are classified as amendments rather than
--     silent overwrites.

ALTER TABLE legacy_contacts ADD COLUMN deleted_at TEXT;     -- ISO 8601; NULL = active
ALTER TABLE legacy_contacts ADD COLUMN deleted_reason TEXT;
ALTER TABLE legacy_contacts ADD COLUMN mutable_until TEXT;

-- Backfill the grace window for existing rows (30 days from creation).
UPDATE legacy_contacts SET mutable_until = datetime(created_at, '+30 days') WHERE mutable_until IS NULL;
