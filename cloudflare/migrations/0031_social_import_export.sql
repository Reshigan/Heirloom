-- Migration: Social Media Import and Export Features
-- Created: 2026-01-20

-- ============================================
-- SOCIAL MEDIA CONNECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('facebook', 'instagram', 'google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISCONNECTED', 'EXPIRED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_provider ON social_connections(provider);

-- ============================================
-- OAUTH STATES (for CSRF protection)
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_states (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  state TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);

-- ============================================
-- EXPORT JOBS
-- ============================================

CREATE TABLE IF NOT EXISTS export_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MEMORIES_PDF', 'LETTERS_PDF', 'FAMILY_BOOK')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  config TEXT, -- JSON configuration
  file_key TEXT, -- R2 storage key for the generated file
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_user ON export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created ON export_jobs(created_at);

-- ============================================
-- IMPORT HISTORY (track what was imported)
-- ============================================

CREATE TABLE IF NOT EXISTS import_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  original_id TEXT NOT NULL, -- ID from the source platform
  memory_id TEXT REFERENCES memories(id) ON DELETE SET NULL,
  imported_at TEXT NOT NULL,
  UNIQUE(user_id, provider, original_id)
);

CREATE INDEX IF NOT EXISTS idx_import_history_user ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_provider ON import_history(provider);
