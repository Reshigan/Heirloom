-- 0038_backfill_thread_mesh.sql
--
-- One-shot backfill that mirrors all pre-mesh user data (memories,
-- voice recordings, letters, capsules, family members) into the
-- Family Thread schema introduced in 0036_family_thread.sql.
--
-- Idempotent: every INSERT is gated by NOT EXISTS, so it's safe to
-- re-apply. The runtime mirror in cloudflare/worker/src/services/threadMesh.ts
-- handles new writes from this point forward.
--
-- Strategy:
--   1. Default thread per existing user (with no FOUNDER membership yet)
--   2. FOUNDER thread_member for that thread
--   3. Mirror memories  → thread_entries (memory_id FK)
--   4. Mirror voice     → thread_entries (voice_recording_id FK)
--   5. Mirror letters   → thread_entries (id prefix 'lt' for idempotency)
--   6. Mirror capsules  → thread_entries (id prefix 'cp')
--   7. Mirror family    → thread_members READER (id prefix 'fm')
--
-- Time-lock unlocks are NOT backfilled — legacy capsules and scheduled
-- letters keep using their existing surfaces. New writes get unlocks
-- via the runtime mirror.

-- ---------------------------------------------------------------------------
-- 1) Default thread for users without a FOUNDER membership
-- ---------------------------------------------------------------------------
INSERT INTO threads (id, name, founder_user_id, default_visibility, plan, status, created_at)
SELECT
  lower(hex(randomblob(16))),
  COALESCE(NULLIF(TRIM(u.first_name), ''), u.email) || '''s family thread',
  u.id,
  'FAMILY',
  'FREE',
  'ACTIVE',
  COALESCE(u.created_at, datetime('now'))
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM thread_members tm
  WHERE tm.user_id = u.id
    AND tm.role = 'FOUNDER'
    AND tm.revoked_at IS NULL
);

-- ---------------------------------------------------------------------------
-- 2) FOUNDER thread_member for each thread that doesn't have one
-- ---------------------------------------------------------------------------
INSERT INTO thread_members
  (id, thread_id, user_id, display_name, email, relation_label, role, generation_offset)
SELECT
  lower(hex(randomblob(16))),
  t.id,
  t.founder_user_id,
  COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email),
  u.email,
  'founder',
  'FOUNDER',
  0
FROM threads t
INNER JOIN users u ON u.id = t.founder_user_id
WHERE NOT EXISTS (
  SELECT 1 FROM thread_members tm
  WHERE tm.thread_id = t.id
    AND tm.user_id = u.id
    AND tm.role = 'FOUNDER'
);

-- ---------------------------------------------------------------------------
-- 3) Mirror existing memories → thread_entries
-- ---------------------------------------------------------------------------
INSERT INTO thread_entries
  (id, thread_id, author_member_id, title, memory_id, visibility, era_year, mutable_until, created_at)
SELECT
  lower(hex(randomblob(16))),
  founder_tm.thread_id,
  founder_tm.id,
  m.title,
  m.id,
  'FAMILY',
  CAST(strftime('%Y', m.created_at) AS INTEGER),
  datetime(m.created_at, '+30 days'),
  m.created_at
FROM memories m
INNER JOIN thread_members founder_tm
  ON founder_tm.user_id = m.user_id
  AND founder_tm.role = 'FOUNDER'
  AND founder_tm.revoked_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM thread_entries te WHERE te.memory_id = m.id
);

-- ---------------------------------------------------------------------------
-- 4) Mirror existing voice recordings → thread_entries
-- ---------------------------------------------------------------------------
INSERT INTO thread_entries
  (id, thread_id, author_member_id, title, voice_recording_id, visibility, era_year, mutable_until, created_at)
SELECT
  lower(hex(randomblob(16))),
  founder_tm.thread_id,
  founder_tm.id,
  v.title,
  v.id,
  'FAMILY',
  CAST(strftime('%Y', v.created_at) AS INTEGER),
  datetime(v.created_at, '+30 days'),
  v.created_at
FROM voice_recordings v
INNER JOIN thread_members founder_tm
  ON founder_tm.user_id = v.user_id
  AND founder_tm.role = 'FOUNDER'
  AND founder_tm.revoked_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM thread_entries te WHERE te.voice_recording_id = v.id
);

-- ---------------------------------------------------------------------------
-- 5) Mirror existing letters → thread_entries (deterministic id 'lt' || letter.id)
-- ---------------------------------------------------------------------------
INSERT INTO thread_entries
  (id, thread_id, author_member_id, title, visibility, era_year, mutable_until, created_at)
SELECT
  'lt' || l.id,
  founder_tm.thread_id,
  founder_tm.id,
  COALESCE(l.title, l.salutation, 'Letter'),
  'FAMILY',
  CAST(strftime('%Y', l.created_at) AS INTEGER),
  datetime(l.created_at, '+30 days'),
  l.created_at
FROM letters l
INNER JOIN thread_members founder_tm
  ON founder_tm.user_id = l.user_id
  AND founder_tm.role = 'FOUNDER'
  AND founder_tm.revoked_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM thread_entries te WHERE te.id = 'lt' || l.id
);

-- ---------------------------------------------------------------------------
-- 6) Mirror existing time capsules → thread_entries (deterministic id 'cp' || capsule.id)
-- ---------------------------------------------------------------------------
INSERT INTO thread_entries
  (id, thread_id, author_member_id, title, visibility, era_year, mutable_until, created_at)
SELECT
  'cp' || c.id,
  founder_tm.thread_id,
  founder_tm.id,
  c.title,
  'FAMILY',
  CAST(strftime('%Y', c.created_at) AS INTEGER),
  datetime(c.created_at, '+30 days'),
  c.created_at
FROM time_capsules c
INNER JOIN thread_members founder_tm
  ON founder_tm.user_id = c.creator_id
  AND founder_tm.role = 'FOUNDER'
  AND founder_tm.revoked_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM thread_entries te WHERE te.id = 'cp' || c.id
);

-- ---------------------------------------------------------------------------
-- 7) Mirror family_members → thread_members READER (deterministic id 'fm' || family_member.id)
-- ---------------------------------------------------------------------------
INSERT INTO thread_members
  (id, thread_id, display_name, email, relation_label, role, generation_offset, birth_date, granted_by_member_id)
SELECT
  'fm' || fm.id,
  founder_tm.thread_id,
  fm.name,
  fm.email,
  fm.relationship,
  'READER',
  0,
  fm.birth_date,
  founder_tm.id
FROM family_members fm
INNER JOIN thread_members founder_tm
  ON founder_tm.user_id = fm.user_id
  AND founder_tm.role = 'FOUNDER'
  AND founder_tm.revoked_at IS NULL
WHERE NOT EXISTS (
  SELECT 1 FROM thread_members tm WHERE tm.id = 'fm' || fm.id
);
