-- Migration: Expand segment constraint to include all influencer segments
-- This allows adding influencers from all categories (lifestyle, wellness, entertainment, etc.)

-- SQLite doesn't support ALTER COLUMN to modify CHECK constraints
-- We need to recreate the table with the expanded constraint
-- Note: This table has been extended by migrations 0028 and 0029 with additional columns

-- Step 1: Create new table with expanded segment constraint (includes all columns from 0021, 0028, 0029)
CREATE TABLE IF NOT EXISTS influencers_new (
  -- Original columns from 0021
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  email TEXT,
  platform TEXT NOT NULL,
  handle TEXT,
  profile_url TEXT,
  follower_count INTEGER,
  segment TEXT CHECK (segment IN (
    -- Original segments
    'GENEALOGY', 'GRIEF', 'PARENTING', 'TECH', 'ESTATE_PLANNING', 'PODCAST', 'OTHER',
    -- Lifestyle & Family
    'LIFESTYLE', 'FAMILY_TRAVEL', 'FAMILY_VLOG', 'FAMILY_LIFESTYLE', 'HOME_FAMILY', 'KIDS_FAMILY',
    'LIFESTYLE_MOM', 'FASHION_MOM',
    -- Entertainment & Media
    'ENTERTAINMENT', 'COMEDY', 'COMEDY_PARENTING', 'MAGIC', 'INTERVIEW',
    -- Wellness & Mental Health
    'WELLNESS', 'WELLNESS_CELEBRITY', 'WELLNESS_COACHING', 'MENTAL_HEALTH', 'THERAPY', 'PSYCHOLOGY',
    'SPIRITUALITY', 'SPIRITUALITY_COACHING', 'YOGA',
    -- Motivation & Leadership
    'MOTIVATION', 'INSPIRATION', 'LEADERSHIP', 'COACHING', 'ENTREPRENEURSHIP', 'PRODUCTIVITY',
    -- Grief & Support
    'GRIEF_FAMILY', 'GRIEF_RESILIENCE', 'GRIEF_COACHING',
    -- Parenting
    'PARENTING_PSYCHOLOGY', 'PARENTING_COACHING',
    -- Senior
    'SENIOR_LIVING', 'SENIOR_FASHION', 'SENIOR_FITNESS', 'SENIOR_LIFESTYLE', 'SENIOR_COACHING',
    -- Wedding & Celebration
    'WEDDING', 'WEDDING_PHOTO', 'WEDDING_PLANNING',
    -- Faith & Military
    'FAITH', 'MILITARY', 'MILITARY_FITNESS', 'MILITARY_LEADERSHIP',
    -- Heritage & Memoir
    'HERITAGE', 'MEMOIR', 'MEMOIR_COACHING', 'STORYTELLING', 'SCRAPBOOKING',
    -- Photography
    'PHOTOGRAPHY', 'PHOTOGRAPHY_BUSINESS',
    -- Finance & Health
    'FINANCE', 'FINANCE_PLANNING', 'HEALTH', 'FITNESS',
    -- Celebrity
    'CELEBRITY', 'CELEBRITY_MOM', 'CELEBRITY_DAD',
    -- Relationships
    'RELATIONSHIPS'
  )),
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'RESPONDED', 'INTERESTED', 'PARTNERED', 'DECLINED', 'UNSUBSCRIBED', 'NO_RESPONSE')),
  consent_given INTEGER DEFAULT 0,
  consent_date TEXT,
  source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'CSV_IMPORT', 'SIGNUP_FORM', 'REFERRAL', 'WEB_SEARCH')),
  notes TEXT,
  last_contacted_at TEXT,
  response_received_at TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  -- Columns added by 0028
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_channel TEXT,
  twitter_handle TEXT,
  website_url TEXT,
  tier TEXT DEFAULT 'MICRO',
  niche TEXT,
  commission_type TEXT DEFAULT 'FLAT',
  commission_rate INTEGER DEFAULT 20,
  discount_code TEXT,
  discount_percent INTEGER DEFAULT 15,
  landing_page_slug TEXT,
  payment_email TEXT,
  payment_method TEXT DEFAULT 'PAYPAL',
  total_clicks INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue_generated INTEGER DEFAULT 0,
  total_commission_earned INTEGER DEFAULT 0,
  total_commission_paid INTEGER DEFAULT 0,
  agreement_signed_at TEXT,
  agreement_version TEXT,
  approved_at TEXT,
  last_activity_at TEXT,
  
  -- Columns added by 0029
  stripe_account_id TEXT,
  stripe_account_status TEXT DEFAULT 'NOT_CONNECTED' CHECK (stripe_account_status IN ('NOT_CONNECTED', 'PENDING', 'ACTIVE', 'RESTRICTED', 'DISABLED')),
  stripe_onboarding_completed INTEGER DEFAULT 0,
  payout_threshold INTEGER DEFAULT 5000,
  auto_payout_enabled INTEGER DEFAULT 1,
  next_payout_date TEXT
);

-- Step 2: Copy existing data with explicit column list
INSERT INTO influencers_new (
  id, name, email, platform, handle, profile_url, follower_count, segment,
  status, consent_given, consent_date, source, notes, last_contacted_at,
  response_received_at, metadata, created_at, updated_at,
  instagram_handle, tiktok_handle, youtube_channel, twitter_handle, website_url,
  tier, niche, commission_type, commission_rate, discount_code, discount_percent,
  landing_page_slug, payment_email, payment_method, total_clicks, total_signups,
  total_conversions, total_revenue_generated, total_commission_earned, total_commission_paid,
  agreement_signed_at, agreement_version, approved_at, last_activity_at,
  stripe_account_id, stripe_account_status, stripe_onboarding_completed,
  payout_threshold, auto_payout_enabled, next_payout_date
)
SELECT 
  id, name, email, platform, handle, profile_url, follower_count, segment,
  status, consent_given, consent_date, source, notes, last_contacted_at,
  response_received_at, metadata, created_at, updated_at,
  instagram_handle, tiktok_handle, youtube_channel, twitter_handle, website_url,
  tier, niche, commission_type, commission_rate, discount_code, discount_percent,
  landing_page_slug, payment_email, payment_method, total_clicks, total_signups,
  total_conversions, total_revenue_generated, total_commission_earned, total_commission_paid,
  agreement_signed_at, agreement_version, approved_at, last_activity_at,
  stripe_account_id, stripe_account_status, stripe_onboarding_completed,
  payout_threshold, auto_payout_enabled, next_payout_date
FROM influencers;

-- Step 3: Drop the view that depends on influencers table
DROP VIEW IF EXISTS influencer_commission_summary;

-- Step 4: Drop old table
DROP TABLE influencers;

-- Step 5: Rename new table
ALTER TABLE influencers_new RENAME TO influencers;

-- Step 6: Recreate indexes (from 0021, 0028, 0029)
CREATE INDEX idx_influencers_segment ON influencers(segment);
CREATE INDEX idx_influencers_status ON influencers(status);
CREATE INDEX idx_influencers_platform ON influencers(platform);
CREATE UNIQUE INDEX idx_influencers_email ON influencers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_influencers_discount_code ON influencers(discount_code);
CREATE INDEX idx_influencers_landing_page ON influencers(landing_page_slug);
CREATE INDEX idx_influencers_tier ON influencers(tier);
CREATE INDEX idx_influencers_stripe_account ON influencers(stripe_account_id);

-- Step 7: Recreate the view from 0029
CREATE VIEW IF NOT EXISTS influencer_commission_summary AS
SELECT 
  i.id as influencer_id,
  i.name,
  i.email,
  i.stripe_account_id,
  i.stripe_account_status,
  i.payout_threshold,
  i.auto_payout_enabled,
  i.total_commission_earned,
  i.total_commission_paid,
  (i.total_commission_earned - i.total_commission_paid) as pending_balance,
  (SELECT COUNT(*) FROM influencer_conversions ic WHERE ic.influencer_id = i.id AND ic.commission_status = 'PENDING') as pending_conversions,
  (SELECT SUM(commission_amount) FROM influencer_conversions ic WHERE ic.influencer_id = i.id AND ic.commission_status = 'PENDING') as pending_commission_amount,
  (SELECT COUNT(*) FROM influencer_payouts ip WHERE ip.influencer_id = i.id AND ip.status = 'COMPLETED') as total_payouts,
  (SELECT MAX(completed_at) FROM influencer_payouts ip WHERE ip.influencer_id = i.id AND ip.status = 'COMPLETED') as last_payout_date
FROM influencers i
WHERE i.status = 'ACTIVE';
