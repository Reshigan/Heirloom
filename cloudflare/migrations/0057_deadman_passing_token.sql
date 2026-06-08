-- Migration 0057: add passing_token to dead_man_switches
-- Used for inheritance verification during the passing/release flow.
-- CANCELLED is already present in the status CHECK constraint (0001_initial.sql),
-- so no table rebuild is needed — plain ALTER TABLE suffices.

ALTER TABLE dead_man_switches ADD COLUMN passing_token TEXT;

CREATE INDEX IF NOT EXISTS idx_dead_man_switches_passing_token ON dead_man_switches(passing_token);
