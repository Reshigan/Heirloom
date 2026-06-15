-- Migration 0061: create three tables referenced by worker code but never
-- defined in any prior migration. Each query against them threw "no such table"
-- at runtime (some swallowed by try/catch, some — getBouncedEmails /
-- hasEmailBounced in mailbox-bounce-detector — not). All CREATE IF NOT EXISTS,
-- additive, no data touched.

-- encryption_keys — engagement-v2 awards points for "encryption_setup" by
-- counting a user's rows here (SELECT COUNT(*) ... WHERE user_id = ?).
CREATE TABLE IF NOT EXISTS encryption_keys (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_type    TEXT,
  public_key  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_user_id ON encryption_keys(user_id);

-- influencer_outreach — admin analytics groups sends by outreach_type over the
-- last 30 days (COUNT(*), COUNT(DISTINCT influencer_id)).
CREATE TABLE IF NOT EXISTS influencer_outreach (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  influencer_id TEXT,
  outreach_type TEXT,
  sent_at       TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_influencer ON influencer_outreach(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_sent_at    ON influencer_outreach(sent_at);
CREATE INDEX IF NOT EXISTS idx_influencer_outreach_type       ON influencer_outreach(outreach_type);

-- influencer_prospects — bounce detection marks status='BOUNCED' and appends to
-- notes; admin lists bounced rows (email, name, status, notes, updated_at).
CREATE TABLE IF NOT EXISTS influencer_prospects (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  status      TEXT NOT NULL DEFAULT 'ACTIVE',
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_influencer_prospects_status ON influencer_prospects(status);
