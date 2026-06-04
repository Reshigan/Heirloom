-- Add email-specific columns to notification_preferences
-- These weren't in the original 0027 push-notifications schema
ALTER TABLE notification_preferences ADD COLUMN email_notifications INTEGER DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN marketing_emails INTEGER DEFAULT 0;
