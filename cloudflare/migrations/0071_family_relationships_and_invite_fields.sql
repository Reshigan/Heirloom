-- 0071 — Member-to-member family-tree edges + full-edit fields on pending invites.
--
-- A1: family_relationships — typed edge between two family_members owned by the
-- same user. type is parent/child/spouse/sibling; label is an optional freeform
-- ("mother", "step-father", "chosen sister"). Symmetric types (spouse/sibling)
-- are canonicalized lower-id-first at the route so a reversed edge cannot sneak
-- past the UNIQUE. Hard-delete — structural metadata, not legacy content.
--
-- A2: family_invites gains relationship/dye/birth_date/notes so the inviter can
-- pre-set a pending invite's full identity (not just name+email). On accept
-- these seed a real family_members row in the inviter's roster (closes the gap
-- where an accepted invite only created a thread_members co-author and never
-- appeared in the family roster). family_members gains linked_user_id so that
-- inviter-created row can later be reconciled with the joining account.
--
-- D1: each migration runs in its own implicit transaction; bare ADD COLUMN and
-- a fresh CREATE TABLE are additive/safe/instant on the live tables.

CREATE TABLE IF NOT EXISTS family_relationships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  to_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parent','child','spouse','sibling')),
  label TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (user_id, from_member_id, to_member_id, type)
);

ALTER TABLE family_invites ADD COLUMN relationship TEXT;
ALTER TABLE family_invites ADD COLUMN dye TEXT;
ALTER TABLE family_invites ADD COLUMN birth_date TEXT;
ALTER TABLE family_invites ADD COLUMN notes TEXT;

ALTER TABLE family_members ADD COLUMN linked_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;