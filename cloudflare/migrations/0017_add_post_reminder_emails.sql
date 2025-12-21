-- Post reminder emails tracking table
-- Tracks when engagement reminder emails are sent to users to avoid spamming

CREATE TABLE IF NOT EXISTS post_reminder_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('memory', 'voice', 'letter', 'weekly')),
  sent_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for efficient lookups by user and sent date
CREATE INDEX IF NOT EXISTS idx_post_reminder_emails_user_sent 
ON post_reminder_emails(user_id, sent_at);
