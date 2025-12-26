-- Migration: Fix support tickets schema and email logging
-- Adds missing columns (ticket_number, description) and updates status constraint
-- Also adds email_type column to email_logs for better tracking

-- ============================================
-- FIX SUPPORT_TICKETS TABLE
-- ============================================
-- SQLite doesn't support ALTER TABLE ADD CONSTRAINT or modifying CHECK constraints
-- So we need to recreate the table with the correct schema

-- Step 1: Create new table with correct schema
CREATE TABLE IF NOT EXISTS support_tickets_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ticket_number TEXT UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED')),
  assigned_to TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

-- Step 2: Copy existing data (if any)
INSERT OR IGNORE INTO support_tickets_new (id, user_id, subject, category, priority, status, assigned_to, metadata, created_at, updated_at, resolved_at)
SELECT id, user_id, subject, category, priority, 
       CASE WHEN status = 'IN_PROGRESS' THEN 'IN_PROGRESS' ELSE status END,
       assigned_to, metadata, created_at, updated_at, resolved_at
FROM support_tickets;

-- Step 3: Drop old table
DROP TABLE IF EXISTS support_tickets;

-- Step 4: Rename new table
ALTER TABLE support_tickets_new RENAME TO support_tickets;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON support_tickets(ticket_number);

-- ============================================
-- ADD EMAIL_TYPE TO EMAIL_LOGS
-- ============================================
-- Add email_type column for better filtering/debugging
ALTER TABLE email_logs ADD COLUMN email_type TEXT;

-- Create index for email_type
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);

-- ============================================
-- ADD GOLD_LEGACY_INVITATION TO GIFT_VOUCHER_EMAILS
-- ============================================
-- SQLite doesn't support modifying CHECK constraints, so we recreate the table

CREATE TABLE IF NOT EXISTS gift_voucher_emails_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id TEXT NOT NULL REFERENCES gift_vouchers(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('PURCHASE_CONFIRMATION', 'GIFT_SENT', 'GIFT_REMINDER', 'REDEMPTION_CONFIRMATION', 'GOLD_LEGACY_INVITATION')),
  recipient_email TEXT NOT NULL,
  sent_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'BOUNCED'))
);

-- Copy existing data
INSERT OR IGNORE INTO gift_voucher_emails_new (id, voucher_id, email_type, recipient_email, sent_at, status)
SELECT id, voucher_id, email_type, recipient_email, sent_at, status
FROM gift_voucher_emails;

-- Drop old table
DROP TABLE IF EXISTS gift_voucher_emails;

-- Rename new table
ALTER TABLE gift_voucher_emails_new RENAME TO gift_voucher_emails;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_voucher_emails_voucher ON gift_voucher_emails(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_emails_type ON gift_voucher_emails(email_type);
