-- Migration 0060: add FK constraint to memory_files.user_id
-- SQLite cannot ALTER to add a FK; rebuild the table with the constraint.

PRAGMA defer_foreign_keys = true;

CREATE TABLE IF NOT EXISTS memory_files_new (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  memory_id     TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_key      TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INTEGER,
  thumbnail_url TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO memory_files_new
  SELECT id, memory_id, user_id, file_key, file_type, file_size, thumbnail_url, created_at
  FROM memory_files;

DROP TABLE memory_files;
ALTER TABLE memory_files_new RENAME TO memory_files;

CREATE INDEX IF NOT EXISTS idx_memory_files_memory_id ON memory_files(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_files_user_id   ON memory_files(user_id);

PRAGMA defer_foreign_keys = false;
