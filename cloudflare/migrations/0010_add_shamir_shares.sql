-- Migration 0010: Add shamir_shares table for distributed key escrow
-- Implements Shamir Secret Sharing for master key distribution to legacy contacts

CREATE TABLE IF NOT EXISTS shamir_shares (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  legacy_contact_id TEXT NOT NULL REFERENCES legacy_contacts(id) ON DELETE CASCADE,
  share_data TEXT NOT NULL,
  share_index INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  total_shares INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, legacy_contact_id)
);

CREATE INDEX idx_shamir_shares_user ON shamir_shares(user_id);
CREATE INDEX idx_shamir_shares_contact ON shamir_shares(legacy_contact_id);
