-- Migration: Social Posting Engine
-- Adds tables for automated social media posting across 7 platforms

-- Social posts queue (scheduled, published, failed)
CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  platforms TEXT NOT NULL,           -- JSON: ["tiktok","instagram","facebook","twitter","linkedin","youtube","threads"]
  content TEXT NOT NULL,             -- JSON: {text, videoKey, hashtags, platformOverrides}
  scheduled_at TEXT NOT NULL,        -- ISO 8601
  published_at TEXT,
  campaign_week INTEGER,
  pillar TEXT,                       -- educational, emotional, demo, engagement, viral
  status TEXT DEFAULT 'scheduled',   -- scheduled, publishing, published, failed, skipped
  api_response TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_social_status_schedule ON social_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_week ON social_posts(campaign_week);

-- Content templates for reuse (12 weeks x 5 posts/week = 60 templates)
CREATE TABLE IF NOT EXISTS social_templates (
  id TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  day TEXT NOT NULL,                  -- monday, tuesday, wednesday, thursday, friday
  pillar TEXT NOT NULL,
  content TEXT NOT NULL,             -- JSON: {hook, body, cta, hashtags}
  video_key TEXT,                    -- R2 key for video asset
  platform_overrides TEXT,           -- JSON: per-platform caption variants
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_templates_week ON social_templates(week, day);
