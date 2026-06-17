-- Migration: 0064_memory_voice_legacy_recipients
-- Allow memories and voice recordings to be addressed directly to legacy contacts
-- for inherit access control — the parallel of 0054's letter_legacy_recipients.
--
-- Until a memory/voice recording appears in the matching table for a given
-- legacy_contact_id, that contact will NOT see it through the inherit portal,
-- closing the vulnerability where every inherit session was exposed to all
-- sealed entries regardless of the intended recipient.

CREATE TABLE IF NOT EXISTS memory_legacy_recipients (
  memory_id         TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  legacy_contact_id TEXT NOT NULL REFERENCES legacy_contacts(id) ON DELETE CASCADE,
  added_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (memory_id, legacy_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_legacy_recipients_contact
  ON memory_legacy_recipients(legacy_contact_id);

CREATE INDEX IF NOT EXISTS idx_memory_legacy_recipients_memory
  ON memory_legacy_recipients(memory_id);

CREATE TABLE IF NOT EXISTS voice_legacy_recipients (
  voice_recording_id TEXT NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
  legacy_contact_id  TEXT NOT NULL REFERENCES legacy_contacts(id) ON DELETE CASCADE,
  added_at           INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (voice_recording_id, legacy_contact_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_legacy_recipients_contact
  ON voice_legacy_recipients(legacy_contact_id);

CREATE INDEX IF NOT EXISTS idx_voice_legacy_recipients_voice
  ON voice_legacy_recipients(voice_recording_id);
