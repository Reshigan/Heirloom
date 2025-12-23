-- Migration 0018: Fix gift_vouchers billing_cycle constraint to include 'quarterly'
-- SQLite doesn't support ALTER TABLE to modify CHECK constraints, so we need to recreate the table

-- Step 1: Create new table with correct constraint
CREATE TABLE IF NOT EXISTS gift_vouchers_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Voucher code (unique, redeemable)
  code TEXT UNIQUE NOT NULL,
  
  -- Purchaser info
  purchaser_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  
  -- Recipient info (optional at purchase, filled at redemption)
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_message TEXT,
  
  -- Voucher details
  tier TEXT NOT NULL CHECK (tier IN ('STARTER', 'FAMILY', 'FOREVER')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
  duration_months INTEGER NOT NULL DEFAULT 12,
  
  -- Pricing (captured at purchase time)
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Stripe
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'SENT', 'REDEEMED', 'EXPIRED', 'REFUNDED', 'CANCELLED')),
  
  -- Redemption
  redeemed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TEXT,
  
  -- Expiry (vouchers expire after 1 year if not redeemed)
  expires_at TEXT NOT NULL,
  
  -- Admin notes
  admin_notes TEXT,
  created_by_admin_id TEXT,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  sent_at TEXT,
  
  -- Gold Legacy voucher fields
  voucher_type TEXT DEFAULT 'GIFT' CHECK (voucher_type IN ('GIFT', 'GOLD_LEGACY')),
  gold_member_number TEXT
);

-- Step 2: Copy data from old table to new table (explicitly list columns since new table has additional columns)
INSERT INTO gift_vouchers_new (
  id, code, purchaser_user_id, purchaser_email, purchaser_name,
  recipient_email, recipient_name, recipient_message,
  tier, billing_cycle, duration_months,
  amount, currency,
  stripe_payment_intent_id, stripe_checkout_session_id,
  status, redeemed_by_user_id, redeemed_at,
  expires_at, admin_notes, created_by_admin_id,
  created_at, updated_at, paid_at, sent_at
)
SELECT 
  id, code, purchaser_user_id, purchaser_email, purchaser_name,
  recipient_email, recipient_name, recipient_message,
  tier, billing_cycle, duration_months,
  amount, currency,
  stripe_payment_intent_id, stripe_checkout_session_id,
  status, redeemed_by_user_id, redeemed_at,
  expires_at, admin_notes, created_by_admin_id,
  created_at, updated_at, paid_at, sent_at
FROM gift_vouchers;

-- Step 3: Drop old table
DROP TABLE gift_vouchers;

-- Step 4: Rename new table to original name
ALTER TABLE gift_vouchers_new RENAME TO gift_vouchers;

-- Step 5: Recreate indexes
CREATE INDEX idx_gift_vouchers_code ON gift_vouchers(code);
CREATE INDEX idx_gift_vouchers_purchaser ON gift_vouchers(purchaser_user_id);
CREATE INDEX idx_gift_vouchers_recipient ON gift_vouchers(recipient_email);
CREATE INDEX idx_gift_vouchers_status ON gift_vouchers(status);
CREATE INDEX idx_gift_vouchers_redeemed_by ON gift_vouchers(redeemed_by_user_id);
CREATE INDEX idx_gift_vouchers_stripe ON gift_vouchers(stripe_payment_intent_id);
