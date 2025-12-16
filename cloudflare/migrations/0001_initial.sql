-- Heirloom D1 Database Schema
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0001_initial.sql

-- ============================================
-- USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  email_verified INTEGER DEFAULT 0,
  two_factor_enabled INTEGER DEFAULT 0,
  two_factor_secret TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  
  -- Encryption
  encryption_salt TEXT,
  encrypted_master_key TEXT,
  key_derivation_params TEXT, -- JSON
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'ESSENTIAL', 'FAMILY', 'LEGACY')),
  status TEXT DEFAULT 'TRIALING' CHECK (status IN ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  trial_ends_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ============================================
-- FAMILY MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS family_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  birth_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_family_user ON family_members(user_id);

-- ============================================
-- MEMORIES
-- ============================================

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PHOTO', 'VOICE', 'LETTER', 'VIDEO')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_key TEXT,
  file_size INTEGER,
  mime_type TEXT,
  metadata TEXT, -- JSON
  
  -- Encryption
  encrypted INTEGER DEFAULT 1,
  encryption_iv TEXT,
  encryption_auth_tag TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_type ON memories(type);

-- Memory Recipients (many-to-many)
CREATE TABLE IF NOT EXISTS memory_recipients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(memory_id, family_member_id)
);

-- ============================================
-- LETTERS
-- ============================================

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  salutation TEXT,
  body TEXT NOT NULL,
  signature TEXT,
  delivery_trigger TEXT DEFAULT 'IMMEDIATE' CHECK (delivery_trigger IN ('IMMEDIATE', 'SCHEDULED', 'POSTHUMOUS')),
  scheduled_date TEXT,
  sealed_at TEXT,
  
  -- Encryption
  encrypted INTEGER DEFAULT 1,
  encryption_iv TEXT,
  encryption_auth_tag TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_letters_user ON letters(user_id);
CREATE INDEX idx_letters_trigger ON letters(delivery_trigger);

-- Letter Recipients
CREATE TABLE IF NOT EXISTS letter_recipients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  letter_id TEXT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(letter_id, family_member_id)
);

-- Letter Deliveries
CREATE TABLE IF NOT EXISTS letter_deliveries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  letter_id TEXT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SCHEDULED', 'DELIVERED', 'FAILED')),
  sent_at TEXT,
  delivered_at TEXT,
  failed_at TEXT,
  failure_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_deliveries_letter ON letter_deliveries(letter_id);
CREATE INDEX idx_deliveries_status ON letter_deliveries(status);

-- ============================================
-- VOICE RECORDINGS
-- ============================================

CREATE TABLE IF NOT EXISTS voice_recordings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  file_size INTEGER NOT NULL,
  waveform_data TEXT, -- JSON
  transcript TEXT,
  prompt TEXT,
  
  -- Encryption
  encrypted INTEGER DEFAULT 1,
  encryption_iv TEXT,
  encryption_auth_tag TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_voice_user ON voice_recordings(user_id);

-- Voice Recipients
CREATE TABLE IF NOT EXISTS voice_recipients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  voice_recording_id TEXT NOT NULL REFERENCES voice_recordings(id) ON DELETE CASCADE,
  family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(voice_recording_id, family_member_id)
);

-- ============================================
-- DEAD MAN'S SWITCH
-- ============================================

CREATE TABLE IF NOT EXISTS dead_man_switches (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabled INTEGER DEFAULT 1,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WARNING', 'TRIGGERED', 'VERIFIED', 'RELEASED', 'CANCELLED')),
  check_in_interval_days INTEGER DEFAULT 30,
  grace_period_days INTEGER DEFAULT 7,
  required_verifications INTEGER DEFAULT 2,
  last_check_in TEXT,
  next_check_in_due TEXT,
  missed_check_ins INTEGER DEFAULT 0,
  triggered_at TEXT,
  verified_at TEXT,
  released_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_deadman_status ON dead_man_switches(status);
CREATE INDEX idx_deadman_next ON dead_man_switches(next_check_in_due);

-- Check-in History
CREATE TABLE IF NOT EXISTS check_in_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TEXT NOT NULL,
  method TEXT NOT NULL, -- MANUAL, AUTO, SMS, EMAIL
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_checkin_user ON check_in_history(user_id);

-- ============================================
-- LEGACY CONTACTS
-- ============================================

CREATE TABLE IF NOT EXISTS legacy_contacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relationship TEXT NOT NULL,
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verification_token TEXT UNIQUE,
  verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_legacy_user ON legacy_contacts(user_id);
CREATE INDEX idx_legacy_token ON legacy_contacts(verification_token);

-- Switch Verifications
CREATE TABLE IF NOT EXISTS switch_verifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  dead_man_switch_id TEXT NOT NULL REFERENCES dead_man_switches(id) ON DELETE CASCADE,
  legacy_contact_id TEXT NOT NULL REFERENCES legacy_contacts(id) ON DELETE CASCADE,
  verification_token TEXT UNIQUE NOT NULL,
  verified INTEGER DEFAULT 0,
  verified_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_switch_verify_token ON switch_verifications(verification_token);

-- ============================================
-- KEY ESCROW
-- ============================================

CREATE TABLE IF NOT EXISTS key_escrows (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beneficiary_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  release_condition TEXT DEFAULT 'POSTHUMOUS',
  released INTEGER DEFAULT 0,
  released_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, beneficiary_id)
);

CREATE INDEX idx_escrow_user ON key_escrows(user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================
-- STORY PROMPTS
-- ============================================

CREATE TABLE IF NOT EXISTS story_prompts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  emoji TEXT,
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_prompts_category ON story_prompts(category);
CREATE INDEX idx_prompts_active ON story_prompts(active);

-- Seed some prompts
INSERT INTO story_prompts (category, text, emoji, sort_order) VALUES
  ('childhood', 'What is your earliest memory?', '👶', 1),
  ('childhood', 'What games did you play as a child?', '🎮', 2),
  ('family', 'Tell me about your parents', '👨‍👩‍👧', 1),
  ('family', 'What traditions did your family have?', '🎄', 2),
  ('love', 'How did you meet your partner?', '💕', 1),
  ('love', 'What was your wedding day like?', '💒', 2),
  ('wisdom', 'What advice would you give your younger self?', '💡', 1),
  ('wisdom', 'What are you most proud of?', '🏆', 2),
  ('legacy', 'What do you want your family to remember about you?', '✨', 1),
  ('legacy', 'What values are most important to pass on?', '🌟', 2);
