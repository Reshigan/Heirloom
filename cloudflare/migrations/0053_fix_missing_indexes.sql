-- Restore idx_subscriptions_user dropped in migration 0052 (subscriptions table rebuild).
-- Also add deleted_at indexes on letters, voice_recordings, and family_members — these
-- tables were soft-deleted but their deleted_at columns had no index, causing full table
-- scans on every read. The memories table already has idx_memories_deleted (since 0045).

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_letters_deleted ON letters(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_voice_recordings_deleted ON voice_recordings(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_family_members_deleted ON family_members(user_id, deleted_at);
