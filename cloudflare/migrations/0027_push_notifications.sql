-- Push Notifications: Device tokens and notification queue
-- Migration 0027

-- Device tokens table for storing push notification tokens
CREATE TABLE IF NOT EXISTS device_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_name TEXT,
    app_version TEXT,
    os_version TEXT,
    is_active INTEGER DEFAULT 1,
    last_used_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, token)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active);

-- Push notification queue for scheduled/pending notifications
CREATE TABLE IF NOT EXISTS push_notification_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data TEXT, -- JSON payload
    badge_count INTEGER DEFAULT 0,
    scheduled_for TEXT,
    sent_at TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Index for queue processing
CREATE INDEX IF NOT EXISTS idx_push_queue_status ON push_notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_push_queue_scheduled ON push_notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_push_queue_user_id ON push_notification_queue(user_id);

-- User notification preferences (extends existing settings)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    push_enabled INTEGER DEFAULT 1,
    daily_reminders INTEGER DEFAULT 1,
    weekly_digest INTEGER DEFAULT 1,
    streak_alerts INTEGER DEFAULT 1,
    family_activity INTEGER DEFAULT 1,
    milestone_alerts INTEGER DEFAULT 1,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '08:00',
    preferred_time TEXT DEFAULT '09:00',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);
