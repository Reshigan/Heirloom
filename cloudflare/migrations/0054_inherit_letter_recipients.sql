-- Migration: 0054_inherit_letter_recipients
-- Allow letters to be addressed directly to legacy contacts for inherit access control.
-- letter_recipients links letter_id → family_member_id (registered platform users).
-- This new junction table covers the parallel case: a sealed letter explicitly
-- addressed to a legacy contact (a named off-platform recipient who receives
-- access via a dead-man switch verification token).
--
-- Until a letter appears in this table for a given legacy_contact_id, that
-- contact will NOT see the letter through the inherit portal — closing the
-- vulnerability where all sealed letters were exposed to every inherit session
-- regardless of intended recipient.

CREATE TABLE IF NOT EXISTS letter_legacy_recipients (
  letter_id         TEXT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  legacy_contact_id TEXT NOT NULL REFERENCES legacy_contacts(id) ON DELETE CASCADE,
  added_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (letter_id, legacy_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_letter_legacy_recipients_contact
  ON letter_legacy_recipients(legacy_contact_id);

CREATE INDEX IF NOT EXISTS idx_letter_legacy_recipients_letter
  ON letter_legacy_recipients(letter_id);
