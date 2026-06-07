-- Migration: Support conversations + messages
-- Backs the in-app Support assistant: an AI chatbot whose history is persisted
-- per user, and which can escalate to a human (linking to a support_ticket).

CREATE TABLE IF NOT EXISTS support_conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  ticket_number TEXT,            -- set when the conversation is escalated to a human
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ESCALATED', 'CLOSED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_support_conv_user ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_updated ON support_conversations(updated_at);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  conversation_id TEXT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_support_msg_conv ON support_messages(conversation_id);
