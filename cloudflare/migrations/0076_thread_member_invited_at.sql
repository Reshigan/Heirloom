-- thread_members.invited_at — marks a seat as an *explicit invitation* that a
-- matching, verified email address is allowed to claim on sign-in.
--
-- Two code paths write thread_members rows with an email:
--   1. POST /api/threads/:id/members  — a Founder/Successor invites a person
--      and an invitation email is sent. This seat is meant to be claimed.
--   2. services/threadMesh mirrorFamilyMemberIntoDefaultThread — a legacy
--      family_member (a node in the family tree) is mirrored as a READER row.
--      Typing a relative's address into a family tree is NOT an invitation and
--      must never, on its own, hand that address read access to the thread.
--
-- Only path 1 stamps invited_at. claimThreadInvitesByEmail requires it, so
-- every pre-existing row (NULL) stays unclaimable — safe by default.
ALTER TABLE thread_members ADD COLUMN invited_at TEXT;

-- The claim query filters on (user_id IS NULL, invited_at, lower(email)); it
-- runs on every session creation, so keep it off a table scan.
CREATE INDEX IF NOT EXISTS idx_thread_members_invite_claim
  ON thread_members (email)
  WHERE user_id IS NULL AND invited_at IS NOT NULL;
