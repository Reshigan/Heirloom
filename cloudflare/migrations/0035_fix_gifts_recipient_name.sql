-- Fix: Add missing recipient_name column to gifts table
-- The gifts-v2.ts INSERT references recipient_name but migration 0033 didn't include it
ALTER TABLE gifts ADD COLUMN recipient_name TEXT;
