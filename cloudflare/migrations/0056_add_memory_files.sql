-- Migration 0056: add memory_files table
-- Stores file attachments (images, video, documents) attached to a memory.
-- Routes using this table: memory-cards.ts (SELECT file_key, memory_id, file_type)

CREATE TABLE IF NOT EXISTS memory_files (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  memory_id   TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  file_key    TEXT NOT NULL,           -- R2 / storage object key; used in /api/files/:file_key
  file_type   TEXT NOT NULL,           -- MIME type, e.g. 'image/jpeg', 'video/mp4'
  file_size   INTEGER,                 -- bytes, nullable
  thumbnail_url TEXT,                  -- pre-generated thumbnail URL, nullable
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_files_memory_id ON memory_files(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_files_user_id   ON memory_files(user_id);
