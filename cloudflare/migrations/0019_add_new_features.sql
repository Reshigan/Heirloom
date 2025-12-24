-- Migration: Add Legacy Playbook, Recipient Experience, Story Artifacts, and Life Event Triggers
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0019_add_new_features.sql

-- ============================================
-- LEGACY PLAYBOOK / SANCTUARY PLAN
-- ============================================

-- User's legacy plan with progress tracking
CREATE TABLE IF NOT EXISTS legacy_plans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Progress tracking (JSON with completed items)
  completed_items TEXT DEFAULT '[]',
  
  -- Plan settings
  share_progress INTEGER DEFAULT 0,
  share_token TEXT UNIQUE,
  
  -- Stats
  total_items INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_legacy_plans_user ON legacy_plans(user_id);
CREATE INDEX idx_legacy_plans_share ON legacy_plans(share_token);

-- Legacy plan items (checklist items)
CREATE TABLE IF NOT EXISTS legacy_plan_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL CHECK (category IN ('PEOPLE', 'STORIES', 'GRATITUDE', 'PRACTICAL', 'WISDOM')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Completion
  completed INTEGER DEFAULT 0,
  completed_at TEXT,
  
  -- Link to actual content (optional)
  linked_type TEXT CHECK (linked_type IN ('MEMORY', 'LETTER', 'VOICE', 'FAMILY_MEMBER')),
  linked_id TEXT,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_plan_items_user ON legacy_plan_items(user_id);
CREATE INDEX idx_plan_items_category ON legacy_plan_items(category);

-- ============================================
-- RECIPIENT EXPERIENCE MODES
-- ============================================

-- Staged release configuration
CREATE TABLE IF NOT EXISTS release_schedules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Release stage
  stage TEXT NOT NULL CHECK (stage IN ('IMMEDIATE', 'WEEK_1', 'MONTH_1', 'MONTH_3', 'ANNIVERSARY', 'CUSTOM')),
  stage_name TEXT,
  delay_days INTEGER DEFAULT 0,
  
  -- Content type filter
  content_type TEXT CHECK (content_type IN ('ALL', 'MEMORY', 'LETTER', 'VOICE')),
  
  -- Description for recipients
  stage_description TEXT,
  
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_release_schedules_user ON release_schedules(user_id);

-- Family Memory Room - shared space for recipients to add memories
CREATE TABLE IF NOT EXISTS family_memory_rooms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  name TEXT DEFAULT 'Family Memory Room',
  description TEXT,
  
  -- Access control
  access_token TEXT UNIQUE NOT NULL,
  is_active INTEGER DEFAULT 0,
  activated_at TEXT,
  
  -- Settings
  allow_photos INTEGER DEFAULT 1,
  allow_voice INTEGER DEFAULT 1,
  allow_text INTEGER DEFAULT 1,
  moderation_required INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_memory_rooms_user ON family_memory_rooms(user_id);
CREATE INDEX idx_memory_rooms_token ON family_memory_rooms(access_token);

-- Contributions to family memory room
CREATE TABLE IF NOT EXISTS family_room_contributions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  room_id TEXT NOT NULL REFERENCES family_memory_rooms(id) ON DELETE CASCADE,
  
  -- Contributor info
  contributor_name TEXT NOT NULL,
  contributor_email TEXT,
  contributor_relationship TEXT,
  
  -- Content
  content_type TEXT NOT NULL CHECK (content_type IN ('TEXT', 'PHOTO', 'VOICE')),
  title TEXT,
  content TEXT, -- Text content or file URL
  file_key TEXT,
  file_size INTEGER,
  
  -- Moderation
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  moderated_at TEXT,
  
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_contributions_room ON family_room_contributions(room_id);
CREATE INDEX idx_contributions_status ON family_room_contributions(status);

-- ============================================
-- STORY-TO-ARTIFACT (MICRO-DOCUMENTARY)
-- ============================================

CREATE TABLE IF NOT EXISTS story_artifacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Content selection (JSON array of memory/voice IDs)
  selected_memories TEXT DEFAULT '[]',
  selected_voice TEXT,
  captions TEXT, -- JSON array of caption objects
  
  -- Generated artifact
  artifact_url TEXT,
  artifact_key TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- seconds
  
  -- Music/theme
  music_track TEXT,
  theme TEXT DEFAULT 'classic',
  
  -- Sharing
  share_token TEXT UNIQUE,
  share_expires_at TEXT,
  view_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROCESSING', 'READY', 'FAILED')),
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_artifacts_user ON story_artifacts(user_id);
CREATE INDEX idx_artifacts_share ON story_artifacts(share_token);
CREATE INDEX idx_artifacts_status ON story_artifacts(status);

-- ============================================
-- LIFE EVENT TRIGGERS
-- ============================================

CREATE TABLE IF NOT EXISTS life_event_triggers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN ('GRADUATION', 'WEDDING', 'FIRST_CHILD', 'BIRTHDAY_MILESTONE', 'RETIREMENT', 'CUSTOM')),
  event_name TEXT NOT NULL,
  event_description TEXT,
  
  -- Recipient
  family_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  
  -- Trigger settings
  trigger_method TEXT DEFAULT 'MANUAL' CHECK (trigger_method IN ('MANUAL', 'DATE', 'RECIPIENT_CONFIRMS')),
  scheduled_date TEXT,
  
  -- Content to deliver (JSON array of content references)
  content_items TEXT DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TRIGGERED', 'DELIVERED', 'CANCELLED')),
  triggered_at TEXT,
  delivered_at TEXT,
  
  -- Notification settings
  notify_creator INTEGER DEFAULT 1,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_event_triggers_user ON life_event_triggers(user_id);
CREATE INDEX idx_event_triggers_status ON life_event_triggers(status);
CREATE INDEX idx_event_triggers_family ON life_event_triggers(family_member_id);

-- ============================================
-- SEED DEFAULT LEGACY PLAN ITEMS
-- ============================================

-- These will be used as templates when creating a new user's plan
CREATE TABLE IF NOT EXISTS legacy_plan_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

INSERT INTO legacy_plan_templates (category, title, description, sort_order) VALUES
  -- PEOPLE category
  ('PEOPLE', 'Identify 3 people who should receive something', 'Think about who matters most and what you want them to have', 1),
  ('PEOPLE', 'Add your closest family members', 'Build your family constellation with the people you love', 2),
  ('PEOPLE', 'Designate a legacy contact', 'Choose someone to verify and manage your legacy release', 3),
  
  -- STORIES category
  ('STORIES', 'Record one story your kids will ask about', 'The funny, embarrassing, or meaningful story that defines you', 1),
  ('STORIES', 'Capture your earliest memory', 'What is the first thing you remember?', 2),
  ('STORIES', 'Share how you met your partner', 'The love story that started it all', 3),
  ('STORIES', 'Document a family tradition', 'Preserve the traditions that make your family unique', 4),
  
  -- GRATITUDE category
  ('GRATITUDE', 'Write a gratitude letter', 'Thank someone who shaped your life', 1),
  ('GRATITUDE', 'Record an apology or forgiveness', 'Clear the air with someone important', 2),
  ('GRATITUDE', 'Express love to your children', 'Tell them what they mean to you', 3),
  
  -- PRACTICAL category
  ('PRACTICAL', 'List important documents and contacts', 'Where to find wills, accounts, and key contacts', 1),
  ('PRACTICAL', 'Record your wishes', 'Funeral preferences, final wishes, and instructions', 2),
  ('PRACTICAL', 'Share passwords and access info', 'Securely store critical access information', 3),
  
  -- WISDOM category
  ('WISDOM', 'Share advice for your younger self', 'What do you wish you knew earlier?', 1),
  ('WISDOM', 'Record your life philosophy', 'The values and beliefs that guide you', 2),
  ('WISDOM', 'Leave a message for future generations', 'What should your grandchildren know?', 3);
