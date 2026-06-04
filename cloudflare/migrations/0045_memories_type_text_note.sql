-- Extend memories.type CHECK constraint to include TEXT and NOTE
-- SQLite cannot ALTER CHECK constraints, so we recreate the table.
-- Previous valid types: PHOTO, VOICE, LETTER, VIDEO
-- New valid types: + TEXT, NOTE

PRAGMA foreign_keys = OFF;

CREATE TABLE memories_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PHOTO', 'VOICE', 'LETTER', 'VIDEO', 'TEXT', 'NOTE')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_key TEXT,
  file_size INTEGER,
  mime_type TEXT,
  metadata TEXT,
  encrypted INTEGER DEFAULT 1,
  encryption_iv TEXT,
  encryption_auth_tag TEXT,
  emotion TEXT,
  latitude REAL,
  longitude REAL,
  location_name TEXT,
  deleted_at TEXT,
  deleted_reason TEXT,
  mutable_until TEXT,
  description_enc TEXT,
  description_iv TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO memories_new SELECT
  id, user_id, type, title, description, file_url, file_key, file_size, mime_type, metadata,
  encrypted, encryption_iv, encryption_auth_tag, emotion, latitude, longitude, location_name,
  deleted_at, deleted_reason, mutable_until, description_enc, description_iv, created_at, updated_at
FROM memories;

DROP TABLE memories;
ALTER TABLE memories_new RENAME TO memories;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_search ON memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_deleted ON memories(user_id, deleted_at);

PRAGMA foreign_keys = ON;
