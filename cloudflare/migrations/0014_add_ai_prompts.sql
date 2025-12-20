-- AI-Generated Prompts
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0014_add_ai_prompts.sql --remote

CREATE TABLE IF NOT EXISTS ai_prompts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL,
  used_at TEXT,
  shared_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ai_prompts_user ON ai_prompts(user_id);
CREATE INDEX idx_ai_prompts_category ON ai_prompts(category);
