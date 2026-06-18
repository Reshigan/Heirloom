-- Migration: 0065_voice_client_key
-- Idempotency key for voice recordings.
--
-- The offline holding queue (Record.tsx → voiceOfflineQueue → Offline.tsx drain)
-- replays the full getUploadUrl → PUT → POST /voice sequence on reconnect. If a
-- network error arrives AFTER the worker inserted the row but BEFORE the response
-- reaches the client, the recording stays queued and the drain replays the POST —
-- producing a DUPLICATE voice_recordings row.
--
-- client_key is a stable UUID minted client-side at save time and threaded
-- through both the live create and every held-queue replay. The POST handler
-- treats (user_id, client_key) as idempotent: a second create with a key it has
-- already seen returns the existing row instead of inserting again.

ALTER TABLE voice_recordings ADD COLUMN client_key TEXT;

CREATE INDEX IF NOT EXISTS idx_voice_recordings_client_key
  ON voice_recordings(user_id, client_key);
