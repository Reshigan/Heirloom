-- Q4 2025 Features Migration
-- Features: Memory Streaks, Weekly Challenges, Family Tree Referrals, Gift Subscriptions, QR Memorial Codes, Milestone Alerts

-- 1. Memory Streaks Table
CREATE TABLE IF NOT EXISTS memory_streaks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date TEXT,
  streak_started_at TEXT,
  total_memories_created INTEGER DEFAULT 0,
  streak_frozen_until TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_streaks_user ON memory_streaks(user_id);

-- 2. Weekly Challenges Table
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  hashtag TEXT NOT NULL,
  prompt TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  featured_submission_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenges_active ON weekly_challenges(is_active, start_date);

-- 3. Challenge Submissions Table
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  challenge_id TEXT NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_id TEXT REFERENCES memories(id) ON DELETE SET NULL,
  voice_id TEXT REFERENCES voice_recordings(id) ON DELETE SET NULL,
  content TEXT,
  social_shares INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  shared_to_instagram INTEGER DEFAULT 0,
  shared_to_tiktok INTEGER DEFAULT 0,
  shared_to_facebook INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user ON challenge_submissions(user_id);

-- 4. Family Tree Referrals Table
CREATE TABLE IF NOT EXISTS family_referrals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  referrer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  referred_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  family_branch TEXT,
  relationship TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired')),
  reward_claimed INTEGER DEFAULT 0,
  storage_bonus_mb INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  accepted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_family_referrals_referrer ON family_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_family_referrals_code ON family_referrals(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_referrals_email ON family_referrals(referred_email);

-- 5. Referral Rewards Table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK(reward_type IN ('storage_bonus', 'discount', 'free_month', 'lifetime_discount')),
  reward_value TEXT NOT NULL,
  milestone TEXT,
  claimed_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);

-- 6. Gift Subscriptions Table
CREATE TABLE IF NOT EXISTS gift_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  purchaser_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  gift_code TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('STARTER', 'FAMILY', 'FOREVER')),
  duration_months INTEGER NOT NULL DEFAULT 12,
  personal_message TEXT,
  gift_card_style TEXT DEFAULT 'classic',
  scheduled_delivery_date TEXT,
  delivered_at TEXT,
  redeemed_at TEXT,
  redeemed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'delivered', 'redeemed', 'expired', 'refunded')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_code ON gift_subscriptions(gift_code);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_recipient ON gift_subscriptions(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_subscriptions_purchaser ON gift_subscriptions(purchaser_id);

-- 7. QR Memorial Codes Table
CREATE TABLE IF NOT EXISTS qr_memorial_codes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id TEXT REFERENCES family_members(id) ON DELETE SET NULL,
  memorial_name TEXT NOT NULL,
  memorial_description TEXT,
  qr_code TEXT UNIQUE NOT NULL,
  short_url TEXT UNIQUE NOT NULL,
  design_style TEXT DEFAULT 'classic' CHECK(design_style IN ('classic', 'elegant', 'modern', 'floral', 'religious')),
  is_public INTEGER DEFAULT 0,
  password_protected INTEGER DEFAULT 0,
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TEXT,
  birth_date TEXT,
  death_date TEXT,
  location TEXT,
  epitaph TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_memorial_codes_user ON qr_memorial_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_memorial_codes_qr ON qr_memorial_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_memorial_codes_url ON qr_memorial_codes(short_url);

-- 8. Memorial Page Content Table
CREATE TABLE IF NOT EXISTS memorial_page_content (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  memorial_id TEXT NOT NULL REFERENCES qr_memorial_codes(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK(content_type IN ('photo', 'video', 'story', 'tribute', 'memory')),
  content_url TEXT,
  content_text TEXT,
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  is_approved INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memorial_page_content_memorial ON memorial_page_content(memorial_id);

-- 9. Milestone Alerts Table
CREATE TABLE IF NOT EXISTS milestone_alerts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_member_id TEXT REFERENCES family_members(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK(milestone_type IN ('birthday', 'anniversary', 'death_anniversary', 'wedding', 'graduation', 'custom')),
  milestone_name TEXT NOT NULL,
  milestone_date TEXT NOT NULL,
  recurring INTEGER DEFAULT 1,
  reminder_days_before INTEGER DEFAULT 7,
  last_reminded_at TEXT,
  prompt_suggestion TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_milestone_alerts_user ON milestone_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_alerts_date ON milestone_alerts(milestone_date);

-- 10. User Notifications Table (for all feature notifications)
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK(notification_type IN (
    'streak_reminder', 'streak_broken', 'streak_milestone',
    'challenge_new', 'challenge_ending', 'challenge_featured',
    'referral_accepted', 'referral_reward',
    'gift_received', 'gift_redeemed',
    'memorial_view', 'memorial_tribute',
    'milestone_upcoming', 'milestone_today'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata TEXT,
  is_read INTEGER DEFAULT 0,
  is_email_sent INTEGER DEFAULT 0,
  is_push_sent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);

-- Add streak fields to users table
ALTER TABLE users ADD COLUMN streak_notifications_enabled INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN challenge_notifications_enabled INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN milestone_notifications_enabled INTEGER DEFAULT 1;

-- Insert initial weekly challenges
INSERT INTO weekly_challenges (id, title, description, theme, hashtag, prompt, start_date, end_date, is_active) VALUES
('challenge-001', 'Throwback Thursday', 'Share a memory from your childhood that shaped who you are today', 'nostalgia', '#ThrowbackThursday', 'What is your earliest happy memory? Describe the sights, sounds, and feelings.', date('now', 'weekday 4'), date('now', 'weekday 4', '+7 days'), 1),
('challenge-002', 'Grandparents Day Special', 'Honor the wisdom passed down through generations', 'family', '#GrandparentsDay', 'What is the most valuable lesson your grandparents taught you?', date('now', '+7 days'), date('now', '+14 days'), 0),
('challenge-003', 'Holiday Traditions', 'Share your family''s unique holiday traditions', 'traditions', '#FamilyTraditions', 'Describe a holiday tradition that has been passed down in your family.', date('now', '+14 days'), date('now', '+21 days'), 0),
('challenge-004', 'First Job Stories', 'Remember where it all began', 'career', '#FirstJobMemories', 'What was your first job and what did it teach you about life?', date('now', '+21 days'), date('now', '+28 days'), 0);
