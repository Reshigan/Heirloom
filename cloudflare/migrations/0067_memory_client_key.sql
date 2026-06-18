-- Migration: 0067_memory_client_key
-- Idempotency key for memories (mirrors 0065 for voice_recordings).
--
-- The offline holding queue replays the full create sequence on reconnect. If a
-- network error arrives AFTER the worker inserted the row but BEFORE the response
-- reaches the client, the entry stays queued and the drain replays the POST —
-- producing a DUPLICATE memories row.
--
-- client_key is a stable UUID minted client-side at save time and threaded
-- through both the live create and every held-queue replay. The POST handler
-- treats (user_id, client_key) as idempotent: a second create with a key it has
-- already seen returns the existing row instead of inserting again.

ALTER TABLE memories ADD COLUMN client_key TEXT;

-- UNIQUE: the create handler uses ON CONFLICT(user_id, client_key) DO NOTHING,
-- which requires a UNIQUE index/constraint on exactly these columns or the
-- INSERT throws at runtime. NULL client_key rows stay distinct under SQLite's
-- unique-index rules, so existing (pre-key) rows never collide.
CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_client_key
  ON memories(user_id, client_key);
