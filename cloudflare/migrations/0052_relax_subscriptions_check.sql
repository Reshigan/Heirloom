-- Relax the subscriptions tier/status CHECK constraints.
--
-- The original 0001 CHECK only allowed tier IN ('FREE','ESSENTIAL','FAMILY',
-- 'LEGACY') and status IN ('ACTIVE','CANCELLED','PAST_DUE','TRIALING'). The app
-- has since outgrown that: billing/auth/gift/partner/q4 routes write the tiers
-- 'STARTER' and 'FOREVER' and the statuses 'EXPIRED' (and historically the
-- one-L 'CANCELED'). Every such INSERT/UPDATE — Stripe checkout completion, the
-- subscription.deleted webhook, gift/founder Gold-Legacy redemption — was
-- failing the CHECK at the DB and 500ing, silently dropping the subscription.
--
-- SQLite cannot ALTER a CHECK constraint, so rebuild the table with the full
-- value set, preserving all columns, data, and the stripe index. Nothing
-- foreign-keys subscriptions(id), so the drop/rename is safe.
--
-- Column set = 0001_initial (12 cols) + 0008 billing_cycle.

CREATE TABLE subscriptions_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'FREE' CHECK (tier IN ('FREE', 'STARTER', 'ESSENTIAL', 'FAMILY', 'LEGACY', 'FOREVER')),
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
