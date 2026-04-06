-- Heirloom v2.0 Migration
-- Onboarding
ALTER TABLE users ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;

-- Gifts / Viral Loop
CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  memory_id TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_user_id TEXT,
  personal_message TEXT,
  token TEXT UNIQUE NOT NULL,
  unlock_date TEXT,
  claimed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_gifts_token ON gifts(token);
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON gifts(sender_id);

-- Time Capsules
CREATE TABLE IF NOT EXISTS time_capsules (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlock_date TEXT NOT NULL,
  sealed_at TEXT,
  opened_at TEXT,
  cover_style TEXT DEFAULT 'classic',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_capsules_creator ON time_capsules(creator_id);
CREATE INDEX IF NOT EXISTS idx_capsules_unlock ON time_capsules(unlock_date);

CREATE TABLE IF NOT EXISTS capsule_contributors (
  id TEXT PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  user_id TEXT,
  email TEXT,
  invite_token TEXT UNIQUE,
  joined_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (capsule_id) REFERENCES time_capsules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_capsule_contributors_token ON capsule_contributors(invite_token);

CREATE TABLE IF NOT EXISTS capsule_items (
  id TEXT PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  file_key TEXT,
  file_url TEXT,
  encrypted INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (capsule_id) REFERENCES time_capsules(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES capsule_contributors(id)
);

-- Memory Map (geolocation)
ALTER TABLE memories ADD COLUMN latitude REAL;
ALTER TABLE memories ADD COLUMN longitude REAL;
ALTER TABLE memories ADD COLUMN location_name TEXT;
ALTER TABLE voice_recordings ADD COLUMN latitude REAL;
ALTER TABLE voice_recordings ADD COLUMN longitude REAL;
ALTER TABLE voice_recordings ADD COLUMN location_name TEXT;
ALTER TABLE letters ADD COLUMN latitude REAL;
ALTER TABLE letters ADD COLUMN longitude REAL;
ALTER TABLE letters ADD COLUMN location_name TEXT;

-- Interview Mode
ALTER TABLE voice_recordings ADD COLUMN interview_data TEXT;
ALTER TABLE voice_recordings ADD COLUMN recording_type TEXT DEFAULT 'standard';
ALTER TABLE voice_recordings ADD COLUMN interviewee_id TEXT REFERENCES family_members(id);

-- Book Orders
CREATE TABLE IF NOT EXISTS book_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  config TEXT NOT NULL,
  page_count INTEGER,
  cover_type TEXT DEFAULT 'hardcover',
  price_cents INTEGER NOT NULL,
  stripe_session_id TEXT,
  print_provider_order_id TEXT,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  tracking_number TEXT,
  preview_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Legacy Score Cache
CREATE TABLE IF NOT EXISTS legacy_scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  completed_items TEXT NOT NULL DEFAULT '[]',
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_legacy_scores_user ON legacy_scores(user_id);

-- Prompt tracking (for weekly emails)
CREATE TABLE IF NOT EXISTS sent_prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT (datetime('now')),
  channel TEXT DEFAULT 'email',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sent_prompts_user ON sent_prompts(user_id);

-- WhatsApp linking
ALTER TABLE users ADD COLUMN whatsapp_number TEXT;
ALTER TABLE users ADD COLUMN whatsapp_verified INTEGER DEFAULT 0;
