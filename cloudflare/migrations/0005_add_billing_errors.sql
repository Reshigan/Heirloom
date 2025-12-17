-- Migration: Add billing errors table for tracking payment failures
-- Enables admin panel billing analysis with notifications and reprocessing

CREATE TABLE IF NOT EXISTS billing_errors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  error_type TEXT NOT NULL CHECK (error_type IN ('CARD_DECLINED', 'INSUFFICIENT_FUNDS', 'EXPIRED_CARD', 'INVALID_CARD', 'PROCESSING_ERROR', 'FRAUD_SUSPECTED', 'OTHER')),
  error_message TEXT NOT NULL,
  error_code TEXT,
  amount INTEGER, -- Amount in cents
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'FAILED' CHECK (status IN ('FAILED', 'PENDING_RETRY', 'RESOLVED')),
  retry_count INTEGER DEFAULT 0,
  last_retry_at TEXT,
  notified_at TEXT,
  resolved_at TEXT,
  resolution_notes TEXT,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_billing_errors_user ON billing_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_errors_status ON billing_errors(status);
CREATE INDEX IF NOT EXISTS idx_billing_errors_type ON billing_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_billing_errors_created ON billing_errors(created_at);
