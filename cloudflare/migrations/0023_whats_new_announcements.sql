-- What's New Announcements System
-- Stores product announcements and tracks user views

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  feature_type TEXT DEFAULT 'NEW_FEATURE',
  icon TEXT DEFAULT 'sparkles',
  cta_text TEXT,
  cta_link TEXT,
  is_active INTEGER DEFAULT 1,
  send_email INTEGER DEFAULT 0,
  email_sent_at TEXT,
  email_sent_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Track which users have seen which announcements
CREATE TABLE IF NOT EXISTS announcement_views (
  id TEXT PRIMARY KEY,
  announcement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  viewed_at TEXT DEFAULT (datetime('now')),
  dismissed INTEGER DEFAULT 0,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(announcement_id, user_id)
);

-- Track announcement email sends
CREATE TABLE IF NOT EXISTS announcement_emails (
  id TEXT PRIMARY KEY,
  announcement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'SENT',
  sent_at TEXT DEFAULT (datetime('now')),
  opened_at TEXT,
  clicked_at TEXT,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_announcement_views_user ON announcement_views(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement ON announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_emails_announcement ON announcement_emails(announcement_id);
