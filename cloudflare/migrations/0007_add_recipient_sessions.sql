-- Add recipient_sessions table for Recipient Portal
-- This table stores short-lived session tokens for recipients accessing inherited content

CREATE TABLE IF NOT EXISTS recipient_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  verification_id TEXT NOT NULL REFERENCES switch_verifications(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  legacy_contact_id TEXT NOT NULL REFERENCES legacy_contacts(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_recipient_sessions_token ON recipient_sessions(session_token);
CREATE INDEX idx_recipient_sessions_owner ON recipient_sessions(owner_id);
CREATE INDEX idx_recipient_sessions_expires ON recipient_sessions(expires_at);
