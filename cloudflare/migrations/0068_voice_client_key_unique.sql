-- Migration: 0068_voice_client_key_unique
-- Promote the voice_recordings idempotency index to UNIQUE (fixes 0065).
--
-- 0065 added client_key plus a NON-unique index on (user_id, client_key). The
-- create handler now uses ON CONFLICT(user_id, client_key) DO NOTHING to close
-- the concurrent-replay race the pre-check cannot — but ON CONFLICT requires a
-- UNIQUE index/constraint on exactly those columns or the INSERT throws at
-- runtime. This migration drops the non-unique index and recreates it UNIQUE,
-- bringing voice in line with memories (see 0067_memory_client_key).
--
-- NULL client_key rows stay distinct under SQLite's unique-index rules, so any
-- existing pre-key rows never collide.

DROP INDEX IF EXISTS idx_voice_recordings_client_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_recordings_client_key
  ON voice_recordings(user_id, client_key);
