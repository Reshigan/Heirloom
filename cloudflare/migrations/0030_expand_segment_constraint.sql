-- Migration: Expand segment constraint to include all influencer segments
-- This allows adding influencers from all categories (lifestyle, wellness, entertainment, etc.)

-- SQLite doesn't support ALTER COLUMN to modify CHECK constraints
-- We need to recreate the table with the expanded constraint

-- Step 1: Create new table with expanded segment constraint
CREATE TABLE IF NOT EXISTS influencers_new (
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
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Step 2: Copy existing data
INSERT INTO influencers_new 
SELECT * FROM influencers;

-- Step 3: Drop old table
DROP TABLE influencers;

-- Step 4: Rename new table
ALTER TABLE influencers_new RENAME TO influencers;

-- Step 5: Recreate indexes
CREATE INDEX idx_influencers_segment ON influencers(segment);
CREATE INDEX idx_influencers_status ON influencers(status);
CREATE INDEX idx_influencers_platform ON influencers(platform);
CREATE UNIQUE INDEX idx_influencers_email ON influencers(email) WHERE email IS NOT NULL;
