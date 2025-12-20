-- AI Future Letters (Letter from 85-year-old self)
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0015_add_future_letters.sql --remote

CREATE TABLE IF NOT EXISTS ai_future_letters (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_age INTEGER NOT NULL,
  user_values TEXT,
  hopes TEXT,
  fears TEXT,
  loved_ones TEXT,
  letter_content TEXT NOT NULL,
  share_text TEXT,
  shared_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_future_letters_user ON ai_future_letters(user_id);
