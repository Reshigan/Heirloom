-- Add missing user_id indexes for tables that need them for query performance.
-- SQLite does not support ADD CONSTRAINT via ALTER TABLE, so FK constraints
-- are defined only at table-creation time. These indexes cover the lookup path.

CREATE INDEX IF NOT EXISTS idx_billing_errors_user_id
  ON billing_errors(user_id);

CREATE INDEX IF NOT EXISTS idx_post_reminder_emails_user_id
  ON post_reminder_emails(user_id);

CREATE INDEX IF NOT EXISTS idx_announcement_emails_user_id
  ON announcement_emails(user_id);

CREATE INDEX IF NOT EXISTS idx_sent_prompts_user_id
  ON sent_prompts(user_id);

CREATE INDEX IF NOT EXISTS idx_legacy_revisions_user_id
  ON legacy_revisions(user_id);
