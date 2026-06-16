-- Migration 0062: add letter-guardian fields to users.
-- The Settings page lets a user designate a "letter guardian" (name + email)
-- who inherits letter delivery. The frontend already sends guardianEmail /
-- guardianName to PATCH /settings/profile and reads them back from GET
-- /settings/profile, but no column ever existed — the worker silently dropped
-- them, so designating a guardian appeared to succeed yet never persisted.
-- Both columns are nullable and additive; no data is touched.

ALTER TABLE users ADD COLUMN guardian_email TEXT;
ALTER TABLE users ADD COLUMN guardian_name TEXT;
