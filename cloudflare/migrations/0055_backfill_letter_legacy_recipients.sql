-- Backfill: grant all legacy contacts of a letter's author access to all
-- existing sealed letters. Before migration 0054, letter_legacy_recipients
-- did not exist and all sealed letters were visible to any active inherit
-- session for the owner. This restores that access for pre-existing data;
-- new letters created after 0054 use explicit recipient selection.
INSERT OR IGNORE INTO letter_legacy_recipients (letter_id, legacy_contact_id, added_at)
SELECT l.id, lc.id, unixepoch()
FROM letters l
INNER JOIN legacy_contacts lc ON lc.user_id = l.user_id
WHERE l.deleted_at IS NULL
  AND l.sealed_at IS NOT NULL;
