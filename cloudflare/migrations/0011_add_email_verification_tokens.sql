-- Email Verification Tokens
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0011_add_email_verification_tokens.sql --remote

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_email_verify_user ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verify_hash ON email_verification_tokens(token_hash);
