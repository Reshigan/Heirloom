-- Migration 0008: Add missing columns for subscriptions and legacy_contacts
-- Fixes CRITICAL issues from audit report

-- ============================================
-- SUBSCRIPTIONS - Add billing_cycle column
-- ============================================

-- Add billing_cycle column (monthly or yearly billing)
ALTER TABLE subscriptions ADD COLUMN billing_cycle TEXT DEFAULT 'monthly';

-- ============================================
-- LEGACY_CONTACTS - Add role column
-- ============================================

-- Add role column (EXECUTOR, BENEFICIARY, etc.)
ALTER TABLE legacy_contacts ADD COLUMN role TEXT DEFAULT 'EXECUTOR';

-- ============================================
-- Note: The tier constraint cannot be modified in SQLite without recreating the table
-- The code should handle the new tier names (STARTER, FAMILY, FOREVER) gracefully
-- by checking tier values in application code rather than relying on DB constraints
-- ============================================
