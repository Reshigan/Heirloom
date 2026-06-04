-- Migration: User account status, scheduled deletion, and GDPR consent fields
-- GDPR Art. 7(1): controller must be able to demonstrate consent was given.
-- POPIA §11: processing must be authorised; consent must be documented.

ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'SUSPENDED'));
ALTER TABLE users ADD COLUMN delete_after TEXT;        -- ISO 8601; NULL = not scheduled
ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;   -- ISO 8601; NULL = registered before this migration
ALTER TABLE users ADD COLUMN marketing_consent INTEGER DEFAULT 0; -- 0=no, 1=yes
