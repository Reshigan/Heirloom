-- Record which transport actually sent each email (microsoft | resend) and, when
-- the primary (O365 Graph) failed and we fell back, why. Makes deliverability
-- debuggable from the DB instead of only via live worker logs.
ALTER TABLE email_logs ADD COLUMN provider TEXT;
ALTER TABLE email_logs ADD COLUMN provider_note TEXT;
