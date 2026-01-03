-- Memory Cards - Shareable Instagram-ready cards from memories
-- Migration: 0026_memory_cards.sql

CREATE TABLE IF NOT EXISTS memory_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  style TEXT NOT NULL DEFAULT 'quote',
  quote_text TEXT NOT NULL,
  photo_url TEXT,
  author_name TEXT,
  memory_date TEXT,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  shared_at TEXT,
  last_shared_platform TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memory_cards_user ON memory_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_cards_memory ON memory_cards(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_cards_created ON memory_cards(created_at);
