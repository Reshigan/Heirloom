-- Migration 0006: Fix Dead Man's Switch and Encryption Schema
-- Adds missing columns that the code expects

-- ============================================
-- DEAD MAN'S SWITCHES - Add missing columns
-- ============================================

-- Add trigger_action column (what happens when switch triggers)
ALTER TABLE dead_man_switches ADD COLUMN trigger_action TEXT DEFAULT 'RELEASE_ALL';

-- Add notify_contacts column (whether to notify legacy contacts)
ALTER TABLE dead_man_switches ADD COLUMN notify_contacts INTEGER DEFAULT 1;

-- ============================================
-- KEY ESCROWS - Add missing columns
-- ============================================

-- Add escrow_type column (type of escrow: SECURITY_QUESTIONS, TRUSTED_CONTACT, PAPER_KEY)
ALTER TABLE key_escrows ADD COLUMN escrow_type TEXT DEFAULT 'PAPER_KEY';

-- Add recovery_hint column (hint for recovery)
ALTER TABLE key_escrows ADD COLUMN recovery_hint TEXT;

-- Add trusted_contact_id column (reference to legacy_contacts for TRUSTED_CONTACT type)
ALTER TABLE key_escrows ADD COLUMN trusted_contact_id TEXT;

-- ============================================
-- CHECK_IN_HISTORY - Add missing columns
-- ============================================

-- Add dead_man_switch_id column (reference to dead_man_switches)
ALTER TABLE check_in_history ADD COLUMN dead_man_switch_id TEXT;

-- Add check_in_time column (alias for checked_in_at that the code expects)
ALTER TABLE check_in_history ADD COLUMN check_in_time TEXT;

-- Update check_in_time to match checked_in_at for existing records
UPDATE check_in_history SET check_in_time = checked_in_at WHERE check_in_time IS NULL;
