-- Migration: 0063_family_invites_thread_id
-- Remember which thread an accepting user should join.
-- family_invites (0024-era) predates threads, so it has no thread binding —
-- an accepted invite currently can't route the new member into the inviter's
-- intended thread. Add a nullable thread_id so the invite carries that target.
--
-- Plain TEXT column, NO REFERENCES clause: SQLite ALTER TABLE ADD COLUMN cannot
-- add a foreign-key constraint, and the legacy table predates the threads table.

ALTER TABLE family_invites ADD COLUMN thread_id TEXT;

CREATE INDEX IF NOT EXISTS idx_family_invites_thread ON family_invites(thread_id);
