-- Migration: Add recipient messages for Family Echo feature
-- Allows recipients to send notes back to creators

CREATE TABLE IF NOT EXISTS recipient_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Who sent the message (recipient)
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  sender_relationship TEXT,
  
  -- Who receives the message (creator)
  creator_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Optional: which specific content item this is a response to
  content_type TEXT CHECK (content_type IN ('LETTER', 'MEMORY', 'VOICE', 'GENERAL')),
  content_id TEXT,
  
  -- The message itself
  reaction_type TEXT CHECK (reaction_type IN ('THANK_YOU', 'REMEMBER_THIS', 'LOVE_THIS', 'CUSTOM')),
  message TEXT,
  
  -- Voice reply (optional)
  voice_url TEXT,
  voice_duration INTEGER,
  
  -- Status
  read_at TEXT,
  
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_recipient_messages_creator ON recipient_messages(creator_user_id);
CREATE INDEX idx_recipient_messages_read ON recipient_messages(read_at);
CREATE INDEX idx_recipient_messages_content ON recipient_messages(content_type, content_id);
