-- Automated Influencer Payouts
-- Adds Stripe Connect integration for automated commission payouts

-- Add Stripe Connect fields to influencers table
ALTER TABLE influencers ADD COLUMN stripe_account_id TEXT;
ALTER TABLE influencers ADD COLUMN stripe_account_status TEXT DEFAULT 'NOT_CONNECTED' CHECK (stripe_account_status IN ('NOT_CONNECTED', 'PENDING', 'ACTIVE', 'RESTRICTED', 'DISABLED'));
ALTER TABLE influencers ADD COLUMN stripe_onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE influencers ADD COLUMN payout_threshold INTEGER DEFAULT 5000; -- $50 minimum payout in cents
ALTER TABLE influencers ADD COLUMN auto_payout_enabled INTEGER DEFAULT 1;
ALTER TABLE influencers ADD COLUMN next_payout_date TEXT;

-- Create index for Stripe account lookups
CREATE INDEX IF NOT EXISTS idx_influencers_stripe_account ON influencers(stripe_account_id);

-- Add Stripe transfer ID to payouts table
ALTER TABLE influencer_payouts ADD COLUMN stripe_transfer_id TEXT;
ALTER TABLE influencer_payouts ADD COLUMN stripe_payout_id TEXT;
ALTER TABLE influencer_payouts ADD COLUMN failure_reason TEXT;
ALTER TABLE influencer_payouts ADD COLUMN auto_generated INTEGER DEFAULT 0;

-- Create payout schedule table for tracking automated payouts
CREATE TABLE IF NOT EXISTS influencer_payout_schedule (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  
  -- Schedule configuration
  payout_frequency TEXT DEFAULT 'MONTHLY' CHECK (payout_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY')),
  payout_day INTEGER DEFAULT 1, -- Day of month (1-28) or day of week (0-6)
  
  -- Next scheduled run
  next_run_at TEXT,
  last_run_at TEXT,
  
  -- Stats
  total_payouts_processed INTEGER DEFAULT 0,
  total_amount_paid INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Insert default monthly payout schedule (1st of each month)
INSERT INTO influencer_payout_schedule (id, payout_frequency, payout_day, next_run_at)
VALUES ('default', 'MONTHLY', 1, date('now', 'start of month', '+1 month'));

-- Create commission earnings summary view for dashboard
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
