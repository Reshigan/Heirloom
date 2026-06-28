-- Add the DEEP tier to the subscriptions + gift_vouchers tier CHECK constraints.
--
-- The PPP volume ladder introduces a paid 'DEEP' tier above Family (unlimited
-- members, 250 GB, priority — see billing.ts TIER_LIMITS.DEEP). The existing
-- CHECK (set in 0052) only allows ('FREE','STARTER','ESSENTIAL','FAMILY',
-- 'LEGACY','FOREVER'), so granting DEEP at Stripe checkout completion 500s and
-- silently drops the subscription — exactly the class of bug 0052 fixed when
-- STARTER/FOREVER were added.
--
-- SQLite cannot ALTER a CHECK in place, so rebuild each table with 'DEEP'
-- added to its tier CHECK, preserving all columns, data, and indexes. Nothing
-- foreign-keys these tables' ids, so drop/rename is safe.
--
-- Subscriptions column set = 0001_initial (12 cols) + 0008 billing_cycle
-- (matches 0052). Indexes: idx_subscriptions_stripe (0001) +
-- idx_subscriptions_user (0032/0053 — must be recreated here, 0052 missed it).

CREATE TABLE subscriptions_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'STARTER', 'ESSENTIAL', 'FAMILY', 'LEGACY', 'FOREVER', 'DEEP')),
  status TEXT DEFAULT 'TRIALING' CHECK (status IN ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED', 'CANCELED', 'EXPIRED', 'INACTIVE', 'INCOMPLETE')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER DEFAULT 0,
  trial_ends_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  billing_cycle TEXT DEFAULT 'monthly'
);

INSERT INTO subscriptions_new (
  id, user_id, tier, status, stripe_customer_id, stripe_subscription_id,
  current_period_start, current_period_end, cancel_at_period_end, trial_ends_at,
  created_at, updated_at, billing_cycle
)
SELECT
  id, user_id, tier, status, stripe_customer_id, stripe_subscription_id,
  current_period_start, current_period_end, cancel_at_period_end, trial_ends_at,
  created_at, updated_at, billing_cycle
FROM subscriptions;

DROP TABLE subscriptions;
ALTER TABLE subscriptions_new RENAME TO subscriptions;

CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- gift_vouchers: add 'DEEP' so a Deep subscription can be gifted. Column set
-- matches 0018 (the last gift_vouchers rebuild). Recreate all 6 indexes.
CREATE TABLE gift_vouchers_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  code TEXT UNIQUE NOT NULL,
  purchaser_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  recipient_message TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('STARTER', 'FAMILY', 'FOREVER', 'DEEP')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
  duration_months INTEGER NOT NULL DEFAULT 12,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'SENT', 'REDEEMED', 'EXPIRED', 'REFUNDED', 'CANCELLED')),
  redeemed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TEXT,
  expires_at TEXT NOT NULL,
  admin_notes TEXT,
  created_by_admin_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  paid_at TEXT,
  sent_at TEXT,
  voucher_type TEXT DEFAULT 'GIFT' CHECK (voucher_type IN ('GIFT', 'GOLD_LEGACY')),
  gold_member_number TEXT
);

INSERT INTO gift_vouchers_new (
  id, code, purchaser_user_id, purchaser_email, purchaser_name,
  recipient_email, recipient_name, recipient_message,
  tier, billing_cycle, duration_months,
  amount, currency,
  stripe_payment_intent_id, stripe_checkout_session_id,
  status, redeemed_by_user_id, redeemed_at,
  expires_at, admin_notes, created_by_admin_id,
  created_at, updated_at, paid_at, sent_at,
  voucher_type, gold_member_number
)
SELECT
  id, code, purchaser_user_id, purchaser_email, purchaser_name,
  recipient_email, recipient_name, recipient_message,
  tier, billing_cycle, duration_months,
  amount, currency,
  stripe_payment_intent_id, stripe_checkout_session_id,
  status, redeemed_by_user_id, redeemed_at,
  expires_at, admin_notes, created_by_admin_id,
  created_at, updated_at, paid_at, sent_at,
  voucher_type, gold_member_number
FROM gift_vouchers;

DROP TABLE gift_vouchers;
ALTER TABLE gift_vouchers_new RENAME TO gift_vouchers;

CREATE INDEX idx_gift_vouchers_code ON gift_vouchers(code);
CREATE INDEX idx_gift_vouchers_purchaser ON gift_vouchers(purchaser_user_id);
CREATE INDEX idx_gift_vouchers_recipient ON gift_vouchers(recipient_email);
CREATE INDEX idx_gift_vouchers_status ON gift_vouchers(status);
CREATE INDEX idx_gift_vouchers_redeemed_by ON gift_vouchers(redeemed_by_user_id);
CREATE INDEX idx_gift_vouchers_stripe ON gift_vouchers(stripe_payment_intent_id);