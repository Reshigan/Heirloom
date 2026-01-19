-- Referral, Influencer, and Partner Systems for Heirloom
-- Enables user referrals, influencer tracking, and offline partner management
-- Note: referral_codes and influencers tables already exist from 0021_marketing_automation.sql
-- This migration adds new columns and creates additional tables

-- ============================================
-- EXTEND REFERRAL_CODES TABLE (already exists)
-- ============================================

-- Add new columns to existing referral_codes table
ALTER TABLE referral_codes ADD COLUMN referrer_reward_type TEXT DEFAULT 'FREE_MONTH';
ALTER TABLE referral_codes ADD COLUMN referrer_reward_value INTEGER DEFAULT 1;
ALTER TABLE referral_codes ADD COLUMN referee_reward_type TEXT DEFAULT 'EXTENDED_TRIAL';
ALTER TABLE referral_codes ADD COLUMN referee_reward_value INTEGER DEFAULT 30;
ALTER TABLE referral_codes ADD COLUMN total_referrals INTEGER DEFAULT 0;
ALTER TABLE referral_codes ADD COLUMN successful_conversions INTEGER DEFAULT 0;
ALTER TABLE referral_codes ADD COLUMN total_rewards_earned INTEGER DEFAULT 0;
ALTER TABLE referral_codes ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

-- ============================================
-- REFERRALS (Tracking individual referrals)
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- The referral code used
  referral_code_id TEXT NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  
  -- Referrer (owner of the code)
  referrer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Referee (person who signed up)
  referee_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  referee_email TEXT NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'CLICKED' CHECK (status IN ('CLICKED', 'SIGNED_UP', 'TRIALING', 'CONVERTED', 'CHURNED')),
  
  -- Conversion tracking
  signed_up_at TEXT,
  converted_at TEXT,
  subscription_tier TEXT,
  subscription_value INTEGER,
  
  -- Rewards
  referrer_reward_applied INTEGER DEFAULT 0,
  referee_reward_applied INTEGER DEFAULT 0,
  referrer_reward_applied_at TEXT,
  referee_reward_applied_at TEXT,
  
  -- Attribution
  landing_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals(referee_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- ============================================
-- EXTEND INFLUENCERS TABLE (already exists from 0021)
-- ============================================

-- Add new columns to existing influencers table
ALTER TABLE influencers ADD COLUMN instagram_handle TEXT;
ALTER TABLE influencers ADD COLUMN tiktok_handle TEXT;
ALTER TABLE influencers ADD COLUMN youtube_channel TEXT;
ALTER TABLE influencers ADD COLUMN twitter_handle TEXT;
ALTER TABLE influencers ADD COLUMN website_url TEXT;
ALTER TABLE influencers ADD COLUMN tier TEXT DEFAULT 'MICRO';
ALTER TABLE influencers ADD COLUMN niche TEXT;
ALTER TABLE influencers ADD COLUMN commission_type TEXT DEFAULT 'FLAT';
ALTER TABLE influencers ADD COLUMN commission_rate INTEGER DEFAULT 20;
ALTER TABLE influencers ADD COLUMN discount_code TEXT;
ALTER TABLE influencers ADD COLUMN discount_percent INTEGER DEFAULT 15;
ALTER TABLE influencers ADD COLUMN landing_page_slug TEXT;
ALTER TABLE influencers ADD COLUMN payment_email TEXT;
ALTER TABLE influencers ADD COLUMN payment_method TEXT DEFAULT 'PAYPAL';
ALTER TABLE influencers ADD COLUMN total_clicks INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN total_signups INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN total_conversions INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN total_revenue_generated INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN total_commission_earned INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN total_commission_paid INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN agreement_signed_at TEXT;
ALTER TABLE influencers ADD COLUMN agreement_version TEXT;
ALTER TABLE influencers ADD COLUMN approved_at TEXT;
ALTER TABLE influencers ADD COLUMN last_activity_at TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_influencers_discount_code ON influencers(discount_code);
CREATE INDEX IF NOT EXISTS idx_influencers_landing_page ON influencers(landing_page_slug);
CREATE INDEX IF NOT EXISTS idx_influencers_tier ON influencers(tier);

-- ============================================
-- INFLUENCER CONVERSIONS (Tracking sales)
-- ============================================

CREATE TABLE IF NOT EXISTS influencer_conversions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- The influencer
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  
  -- The customer
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  
  -- Conversion details
  subscription_tier TEXT NOT NULL,
  subscription_billing_cycle TEXT NOT NULL, -- 'monthly' or 'yearly'
  subscription_value INTEGER NOT NULL, -- in cents
  
  -- Commission
  commission_amount INTEGER NOT NULL, -- in cents
  commission_status TEXT DEFAULT 'PENDING' CHECK (commission_status IN ('PENDING', 'APPROVED', 'PAID', 'DISPUTED', 'CANCELLED')),
  commission_paid_at TEXT,
  
  -- Attribution
  attribution_method TEXT DEFAULT 'DISCOUNT_CODE' CHECK (attribution_method IN ('DISCOUNT_CODE', 'LANDING_PAGE', 'UTM_LINK', 'QR_CODE')),
  discount_code_used TEXT,
  landing_page_used TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_influencer_conversions_influencer ON influencer_conversions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_conversions_user ON influencer_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_conversions_status ON influencer_conversions(commission_status);

-- ============================================
-- INFLUENCER PAYOUTS
-- ============================================

CREATE TABLE IF NOT EXISTS influencer_payouts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- The influencer
  influencer_id TEXT NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  
  -- Payout details
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_reference TEXT, -- PayPal transaction ID, etc.
  
  -- Period covered
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  conversions_count INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_influencer_payouts_influencer ON influencer_payouts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_payouts_status ON influencer_payouts(status);

-- ============================================
-- PARTNERS (Offline partners: funeral homes, estate planners, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Business info
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('FUNERAL_HOME', 'ESTATE_PLANNER', 'SENIOR_LIVING', 'PHOTOGRAPHER', 'GENEALOGY', 'THERAPIST', 'OTHER')),
  contact_name TEXT NOT NULL,
  contact_email TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Wholesale pricing
  wholesale_discount_percent INTEGER DEFAULT 30, -- 30% off retail for bulk purchases
  minimum_order_quantity INTEGER DEFAULT 5,
  
  -- Unique partner code for tracking
  partner_code TEXT UNIQUE NOT NULL,
  
  -- QR code tracking
  qr_code_url TEXT, -- URL to QR code image
  qr_landing_page TEXT, -- Custom landing page for QR scans
  
  -- Commission on referred subscriptions (not wholesale)
  referral_commission_percent INTEGER DEFAULT 15,
  
  -- Stats
  total_wholesale_orders INTEGER DEFAULT 0,
  total_wholesale_revenue INTEGER DEFAULT 0, -- in cents
  total_vouchers_purchased INTEGER DEFAULT 0,
  total_vouchers_redeemed INTEGER DEFAULT 0,
  total_referral_signups INTEGER DEFAULT 0,
  total_referral_conversions INTEGER DEFAULT 0,
  total_referral_commission_earned INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'TERMINATED')),
  
  -- Agreement
  agreement_signed_at TEXT,
  agreement_version TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  approved_at TEXT,
  last_order_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(contact_email);
CREATE INDEX IF NOT EXISTS idx_partners_code ON partners(partner_code);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(business_type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

-- ============================================
-- PARTNER WHOLESALE ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS partner_wholesale_orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- The partner
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Order details
  voucher_tier TEXT NOT NULL CHECK (voucher_tier IN ('STARTER', 'FAMILY', 'LEGACY')),
  voucher_duration_months INTEGER NOT NULL DEFAULT 12,
  quantity INTEGER NOT NULL,
  
  -- Pricing
  unit_price INTEGER NOT NULL, -- wholesale price per voucher in cents
  retail_price INTEGER NOT NULL, -- retail price for reference
  total_amount INTEGER NOT NULL, -- in cents
  discount_applied INTEGER NOT NULL, -- discount amount in cents
  
  -- Payment
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  paid_at TEXT,
  
  -- Fulfillment
  fulfillment_status TEXT DEFAULT 'PENDING' CHECK (fulfillment_status IN ('PENDING', 'PROCESSING', 'FULFILLED', 'PARTIAL')),
  fulfilled_at TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_partner_orders_partner ON partner_wholesale_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_orders_payment ON partner_wholesale_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_partner_orders_fulfillment ON partner_wholesale_orders(fulfillment_status);

-- ============================================
-- PARTNER VOUCHERS (Vouchers from wholesale orders)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_vouchers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Link to wholesale order
  wholesale_order_id TEXT NOT NULL REFERENCES partner_wholesale_orders(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Voucher code (unique, redeemable)
  code TEXT UNIQUE NOT NULL,
  
  -- Voucher details (copied from order)
  tier TEXT NOT NULL CHECK (tier IN ('STARTER', 'FAMILY', 'LEGACY')),
  duration_months INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'REDEEMED', 'EXPIRED', 'CANCELLED')),
  
  -- Assignment (partner can assign to specific recipient)
  assigned_to_name TEXT,
  assigned_to_email TEXT,
  assigned_at TEXT,
  
  -- Redemption
  redeemed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TEXT,
  
  -- Expiry
  expires_at TEXT NOT NULL,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_partner_vouchers_order ON partner_vouchers(wholesale_order_id);
CREATE INDEX IF NOT EXISTS idx_partner_vouchers_partner ON partner_vouchers(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_vouchers_code ON partner_vouchers(code);
CREATE INDEX IF NOT EXISTS idx_partner_vouchers_status ON partner_vouchers(status);

-- ============================================
-- PARTNER REFERRALS (QR code / link referrals)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_referrals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- The partner
  partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  -- The referred user
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  
  -- Attribution
  attribution_method TEXT DEFAULT 'QR_CODE' CHECK (attribution_method IN ('QR_CODE', 'PARTNER_LINK', 'PARTNER_CODE')),
  
  -- Status
  status TEXT DEFAULT 'SIGNED_UP' CHECK (status IN ('CLICKED', 'SIGNED_UP', 'TRIALING', 'CONVERTED', 'CHURNED')),
  
  -- Conversion
  converted_at TEXT,
  subscription_tier TEXT,
  subscription_value INTEGER, -- in cents
  
  -- Commission
  commission_amount INTEGER DEFAULT 0,
  commission_status TEXT DEFAULT 'PENDING' CHECK (commission_status IN ('PENDING', 'APPROVED', 'PAID')),
  commission_paid_at TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_partner_referrals_partner ON partner_referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_user ON partner_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_status ON partner_referrals(status);

-- ============================================
-- DISCOUNT CODES (Unified tracking for all discount codes)
-- ============================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Code
  code TEXT UNIQUE NOT NULL,
  
  -- Owner (can be influencer, partner, or campaign)
  owner_type TEXT NOT NULL CHECK (owner_type IN ('INFLUENCER', 'PARTNER', 'CAMPAIGN', 'ADMIN')),
  owner_id TEXT, -- influencer_id, partner_id, or campaign name
  
  -- Discount details
  discount_type TEXT DEFAULT 'PERCENT' CHECK (discount_type IN ('PERCENT', 'FIXED', 'FREE_TRIAL_EXTENSION')),
  discount_value INTEGER NOT NULL, -- percentage or cents or days
  
  -- Restrictions
  valid_tiers TEXT, -- JSON array of valid tiers, null = all
  valid_billing_cycles TEXT, -- JSON array, null = all
  min_purchase_amount INTEGER, -- minimum in cents
  max_uses INTEGER, -- null = unlimited
  max_uses_per_user INTEGER DEFAULT 1,
  
  -- Validity period
  valid_from TEXT DEFAULT (datetime('now')),
  valid_until TEXT,
  
  -- Stats
  total_uses INTEGER DEFAULT 0,
  total_discount_given INTEGER DEFAULT 0, -- in cents
  
  -- Status
  is_active INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_owner ON discount_codes(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

-- ============================================
-- DISCOUNT CODE USES (Track each use)
-- ============================================

CREATE TABLE IF NOT EXISTS discount_code_uses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- The code used
  discount_code_id TEXT NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  
  -- The user
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  
  -- Usage details
  subscription_tier TEXT NOT NULL,
  original_amount INTEGER NOT NULL, -- in cents
  discount_amount INTEGER NOT NULL, -- in cents
  final_amount INTEGER NOT NULL, -- in cents
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discount_uses_code ON discount_code_uses(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_uses_user ON discount_code_uses(user_id);
