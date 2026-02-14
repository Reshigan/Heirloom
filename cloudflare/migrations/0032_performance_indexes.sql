-- Migration: Performance indexes for large-scale usage
-- Adds composite indexes for common query patterns

CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_user_created ON memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_letters_user_sealed ON letters(user_id, sealed_at);
CREATE INDEX IF NOT EXISTS idx_letters_user_created ON letters(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_recipients_memory ON memory_recipients(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_recipients_family ON memory_recipients(family_member_id);
CREATE INDEX IF NOT EXISTS idx_letter_recipients_letter ON letter_recipients(letter_id);
CREATE INDEX IF NOT EXISTS idx_letter_recipients_family ON letter_recipients(family_member_id);
CREATE INDEX IF NOT EXISTS idx_voice_recipients_voice ON voice_recipients(voice_recording_id);
CREATE INDEX IF NOT EXISTS idx_voice_recipients_family ON voice_recipients(family_member_id);
CREATE INDEX IF NOT EXISTS idx_voice_user_created ON voice_recordings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_letter_deliveries_status_letter ON letter_deliveries(letter_id, status);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_type_status ON drip_campaigns(campaign_type, status);
