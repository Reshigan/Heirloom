-- Full-Text Search for Memories, Voice, and Letters
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0012_add_memory_search.sql --remote

-- FTS5 virtual table for memories
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  title,
  description,
  content='memories',
  content_rowid='rowid'
);

-- FTS5 virtual table for voice transcripts
CREATE VIRTUAL TABLE IF NOT EXISTS voice_fts USING fts5(
  title,
  description,
  transcript,
  content='voice_recordings',
  content_rowid='rowid'
);

-- FTS5 virtual table for letters
CREATE VIRTUAL TABLE IF NOT EXISTS letters_fts USING fts5(
  title,
  salutation,
  body,
  signature,
  content='letters',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with memories table
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, title, description) VALUES (NEW.rowid, NEW.title, NEW.description);
END;

CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, title, description) VALUES('delete', OLD.rowid, OLD.title, OLD.description);
END;

CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, title, description) VALUES('delete', OLD.rowid, OLD.title, OLD.description);
  INSERT INTO memories_fts(rowid, title, description) VALUES (NEW.rowid, NEW.title, NEW.description);
END;

-- Triggers to keep FTS in sync with voice_recordings table
CREATE TRIGGER IF NOT EXISTS voice_ai AFTER INSERT ON voice_recordings BEGIN
  INSERT INTO voice_fts(rowid, title, description, transcript) VALUES (NEW.rowid, NEW.title, NEW.description, NEW.transcript);
END;

CREATE TRIGGER IF NOT EXISTS voice_ad AFTER DELETE ON voice_recordings BEGIN
  INSERT INTO voice_fts(voice_fts, rowid, title, description, transcript) VALUES('delete', OLD.rowid, OLD.title, OLD.description, OLD.transcript);
END;

CREATE TRIGGER IF NOT EXISTS voice_au AFTER UPDATE ON voice_recordings BEGIN
  INSERT INTO voice_fts(voice_fts, rowid, title, description, transcript) VALUES('delete', OLD.rowid, OLD.title, OLD.description, OLD.transcript);
  INSERT INTO voice_fts(rowid, title, description, transcript) VALUES (NEW.rowid, NEW.title, NEW.description, NEW.transcript);
END;

-- Triggers to keep FTS in sync with letters table
CREATE TRIGGER IF NOT EXISTS letters_ai AFTER INSERT ON letters BEGIN
  INSERT INTO letters_fts(rowid, title, salutation, body, signature) VALUES (NEW.rowid, NEW.title, NEW.salutation, NEW.body, NEW.signature);
END;

CREATE TRIGGER IF NOT EXISTS letters_ad AFTER DELETE ON letters BEGIN
  INSERT INTO letters_fts(letters_fts, rowid, title, salutation, body, signature) VALUES('delete', OLD.rowid, OLD.title, OLD.salutation, OLD.body, OLD.signature);
END;

CREATE TRIGGER IF NOT EXISTS letters_au AFTER UPDATE ON letters BEGIN
  INSERT INTO letters_fts(letters_fts, rowid, title, salutation, body, signature) VALUES('delete', OLD.rowid, OLD.title, OLD.salutation, OLD.body, OLD.signature);
  INSERT INTO letters_fts(rowid, title, salutation, body, signature) VALUES (NEW.rowid, NEW.title, NEW.salutation, NEW.body, NEW.signature);
END;
