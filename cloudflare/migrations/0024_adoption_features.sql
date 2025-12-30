-- Migration: Adoption Features
-- Adds tables for engagement features: streaks, badges, family invites, shareable cards, drip campaigns

-- User streaks and engagement tracking
CREATE TABLE IF NOT EXISTS user_streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date TEXT,
  total_activity_days INTEGER DEFAULT 0,
  streak_type TEXT DEFAULT 'daily', -- daily, weekly
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- User badges/achievements
CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- first_memory, first_letter, first_voice, streak_7, streak_30, family_5, etc.
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TEXT NOT NULL,
  notified INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_unique ON user_badges(user_id, badge_type);

-- Family invites with incentives
CREATE TABLE IF NOT EXISTS family_invites (
  id TEXT PRIMARY KEY,
  inviter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired
  reward_claimed INTEGER DEFAULT 0,
  sent_at TEXT NOT NULL,
  accepted_at TEXT,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_family_invites_inviter ON family_invites(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_code ON family_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_invites_email ON family_invites(invitee_email);

-- Shareable memory cards
CREATE TABLE IF NOT EXISTS shareable_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_id TEXT REFERENCES memories(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL, -- memory, milestone, badge, streak
  card_style TEXT DEFAULT 'classic', -- classic, modern, vintage, minimal
  share_token TEXT UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shareable_cards_user ON shareable_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_shareable_cards_token ON shareable_cards(share_token);

-- Drip campaign tracking
CREATE TABLE IF NOT EXISTS drip_campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL, -- welcome, inactive_3d, inactive_7d, inactive_14d, reactivation
  step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- active, completed, unsubscribed
  last_email_sent_at TEXT,
  next_email_due_at TEXT,
  emails_sent INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_drip_campaigns_user ON drip_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_status ON drip_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_next_due ON drip_campaigns(next_email_due_at);

-- Important dates for anniversary/birthday reminders
CREATE TABLE IF NOT EXISTS important_dates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_type TEXT NOT NULL, -- birthday, anniversary, memorial, custom
  person_name TEXT,
  family_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  date_value TEXT NOT NULL, -- MM-DD format for recurring, or full date
  year_value INTEGER, -- optional year for age calculation
  reminder_days_before INTEGER DEFAULT 7,
  last_reminder_sent_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_important_dates_user ON important_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_date ON important_dates(date_value);

-- Onboarding progress tracking
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_completed INTEGER DEFAULT 0,
  profile_completed INTEGER DEFAULT 0,
  first_memory_created INTEGER DEFAULT 0,
  first_family_added INTEGER DEFAULT 0,
  first_letter_written INTEGER DEFAULT 0,
  first_voice_recorded INTEGER DEFAULT 0,
  legacy_contact_added INTEGER DEFAULT 0,
  tour_completed INTEGER DEFAULT 0,
  wizard_dismissed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON onboarding_progress(user_id);

-- Email preferences for unsubscribe functionality
CREATE TABLE IF NOT EXISTS email_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marketing_emails INTEGER DEFAULT 1,
  drip_campaigns INTEGER DEFAULT 1,
  content_prompts INTEGER DEFAULT 1,
  date_reminders INTEGER DEFAULT 1,
  product_updates INTEGER DEFAULT 1,
  weekly_digest INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);

-- Add birthday field to family_members if not exists
-- SQLite doesn't support IF NOT EXISTS for columns, so we'll handle this in code
