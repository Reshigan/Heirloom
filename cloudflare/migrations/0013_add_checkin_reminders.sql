-- Check-In Reminders for Dead Man's Switch
-- Run with: wrangler d1 execute heirloom-db --file=./migrations/0013_add_checkin_reminders.sql --remote

-- Add reminder_sent_at column to track when reminder was last sent
ALTER TABLE dead_man_switches ADD COLUMN reminder_sent_at TEXT;
