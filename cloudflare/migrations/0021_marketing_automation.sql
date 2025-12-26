-- Migration: Marketing Automation System
-- Content library, influencer CRM, email campaigns, and compliance tracking

-- ============================================
-- CONTENT LIBRARY
-- ============================================

-- Store marketing content (posts, captions, assets)
CREATE TABLE IF NOT EXISTS marketing_content (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('POST', 'CAPTION', 'SCRIPT', 'EMAIL_TEMPLATE', 'ASSET')),
  platform TEXT CHECK (platform IN ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'EMAIL', 'ALL')),
  theme TEXT,
  hook_type TEXT,
  audience_segment TEXT,
  body TEXT,
  caption TEXT,
  hashtags TEXT,
  cta TEXT,
  asset_url TEXT,
  asset_key TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'SCHEDULED', 'POSTED', 'ARCHIVED')),
  scheduled_for TEXT,
  posted_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_marketing_content_platform ON marketing_content(platform);
CREATE INDEX idx_marketing_content_status ON marketing_content(status);
CREATE INDEX idx_marketing_content_theme ON marketing_content(theme);

-- ============================================
-- INFLUENCER CRM
-- ============================================

-- Store influencer/creator contacts
CREATE TABLE IF NOT EXISTS influencers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT,
  platform TEXT NOT NULL,
  handle TEXT,
  profile_url TEXT,
  follower_count INTEGER,
  segment TEXT CHECK (segment IN ('GENEALOGY', 'GRIEF', 'PARENTING', 'TECH', 'ESTATE_PLANNING', 'PODCAST', 'OTHER')),
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'PARTNERED', 'DECLINED', 'UNSUBSCRIBED')),
  consent_given INTEGER DEFAULT 0,
  consent_date TEXT,
  source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'CSV_IMPORT', 'SIGNUP_FORM', 'REFERRAL', 'WEB_SEARCH')),
  notes TEXT,
  last_contacted_at TEXT,
  response_received_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_influencers_segment ON influencers(segment);
CREATE INDEX idx_influencers_status ON influencers(status);
CREATE INDEX idx_influencers_platform ON influencers(platform);
CREATE UNIQUE INDEX idx_influencers_email ON influencers(email) WHERE email IS NOT NULL;

-- ============================================
-- EMAIL CAMPAIGNS
-- ============================================

-- Store email campaign definitions
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('INFLUENCER_OUTREACH', 'NEWSLETTER', 'PRODUCT_UPDATE', 'PARTNERSHIP')),
  template_id TEXT REFERENCES marketing_content(id),
  subject_line TEXT NOT NULL,
  from_name TEXT DEFAULT 'The Heirloom Team',
  from_email TEXT DEFAULT 'admin@heirloom.blue',
  target_segment TEXT,
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  scheduled_for TEXT,
  started_at TEXT,
  completed_at TEXT,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  rate_limit_per_hour INTEGER DEFAULT 20,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);

-- Store individual email sends (outreach log)
CREATE TABLE IF NOT EXISTS marketing_outreach (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  campaign_id TEXT REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  influencer_id TEXT REFERENCES influencers(id) ON DELETE CASCADE,
  email_to TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED', 'REPLIED')),
  sent_at TEXT,
  opened_at TEXT,
  clicked_at TEXT,
  replied_at TEXT,
  error_message TEXT,
  tracking_id TEXT UNIQUE,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_marketing_outreach_campaign ON marketing_outreach(campaign_id);
CREATE INDEX idx_marketing_outreach_influencer ON marketing_outreach(influencer_id);
CREATE INDEX idx_marketing_outreach_status ON marketing_outreach(status);
CREATE INDEX idx_marketing_outreach_tracking ON marketing_outreach(tracking_id);

-- ============================================
-- COMPLIANCE & SUPPRESSION
-- ============================================

-- Suppression list (unsubscribes, bounces, complaints)
CREATE TABLE IF NOT EXISTS marketing_suppression (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL CHECK (reason IN ('UNSUBSCRIBE', 'BOUNCE', 'COMPLAINT', 'MANUAL')),
  source_campaign_id TEXT REFERENCES marketing_campaigns(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_marketing_suppression_email ON marketing_suppression(email);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS marketing_audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  admin_id TEXT,
  details TEXT DEFAULT '{}',
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_marketing_audit_action ON marketing_audit_log(action);
CREATE INDEX idx_marketing_audit_entity ON marketing_audit_log(entity_type, entity_id);

-- ============================================
-- CREATOR SIGNUP (INBOUND PIPELINE)
-- ============================================

-- Public signup form for creators/partners
CREATE TABLE IF NOT EXISTS creator_signups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  platform TEXT,
  handle TEXT,
  profile_url TEXT,
  follower_count TEXT,
  content_type TEXT,
  why_interested TEXT,
  consent_marketing INTEGER DEFAULT 0,
  consent_date TEXT,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'APPROVED', 'CONVERTED', 'REJECTED')),
  converted_to_influencer_id TEXT REFERENCES influencers(id),
  reviewed_by TEXT,
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_creator_signups_status ON creator_signups(status);
CREATE INDEX idx_creator_signups_email ON creator_signups(email);

-- ============================================
-- CONTENT CALENDAR
-- ============================================

-- Track scheduled posts across platforms
CREATE TABLE IF NOT EXISTS content_calendar (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  content_id TEXT REFERENCES marketing_content(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'POSTED', 'SKIPPED', 'FAILED')),
  posted_at TEXT,
  post_url TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX idx_content_calendar_platform ON content_calendar(platform);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);

-- ============================================
-- VIRAL REFERRAL SYSTEM
-- ============================================

-- Referral codes for users
CREATE TABLE IF NOT EXISTS referral_codes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  reward_type TEXT DEFAULT 'EXTENDED_TRIAL' CHECK (reward_type IN ('EXTENDED_TRIAL', 'DISCOUNT', 'FREE_MONTH', 'STORAGE_BONUS')),
  reward_value TEXT,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE UNIQUE INDEX idx_referral_codes_code ON referral_codes(code);

-- Track referral conversions
CREATE TABLE IF NOT EXISTS referral_conversions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  referral_code_id TEXT NOT NULL REFERENCES referral_codes(id),
  referred_user_id TEXT NOT NULL REFERENCES users(id),
  referrer_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'REWARDED', 'EXPIRED')),
  reward_given_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_referral_conversions_code ON referral_conversions(referral_code_id);
CREATE INDEX idx_referral_conversions_referrer ON referral_conversions(referrer_user_id);

-- ============================================
-- AUTOMATED EMAIL SEQUENCES (DRIP CAMPAIGNS)
-- ============================================

-- Define email sequences
CREATE TABLE IF NOT EXISTS email_sequences (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('SIGNUP', 'TRIAL_START', 'FIRST_MEMORY', 'FIRST_LETTER', 'INACTIVE_7D', 'INACTIVE_14D', 'INACTIVE_30D', 'SUBSCRIPTION', 'REFERRAL')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Individual emails in a sequence
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sequence_id TEXT NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  cta_text TEXT,
  cta_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_email_sequence_steps_sequence ON email_sequence_steps(sequence_id);

-- Track user progress through sequences
CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sequence_id TEXT NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED', 'UNSUBSCRIBED')),
  next_send_at TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_email_sequence_enrollments_user ON email_sequence_enrollments(user_id);
CREATE INDEX idx_email_sequence_enrollments_next ON email_sequence_enrollments(next_send_at);

-- ============================================
-- SOCIAL PROOF & STATS
-- ============================================

-- Track platform-wide stats for social proof
CREATE TABLE IF NOT EXISTS platform_stats (
  id TEXT PRIMARY KEY DEFAULT 'global',
  total_families INTEGER DEFAULT 0,
  total_memories INTEGER DEFAULT 0,
  total_letters INTEGER DEFAULT 0,
  total_voice_minutes INTEGER DEFAULT 0,
  countries_count INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT (datetime('now'))
);

-- Insert default row
INSERT OR IGNORE INTO platform_stats (id) VALUES ('global');

-- Testimonials for social proof
CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_location TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 0,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_testimonials_featured ON testimonials(is_featured, is_approved);

-- ============================================
-- SHARE TRACKING & INCENTIVES
-- ============================================

-- Track share actions for incentives
CREATE TABLE IF NOT EXISTS share_actions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('MEMORY', 'LETTER', 'ARTIFACT', 'PLAYBOOK', 'REFERRAL_LINK', 'SOCIAL_POST')),
  platform TEXT,
  content_id TEXT,
  share_url TEXT,
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_share_actions_user ON share_actions(user_id);
CREATE INDEX idx_share_actions_type ON share_actions(share_type);
