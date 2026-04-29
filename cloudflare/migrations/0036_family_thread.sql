-- The Family Thread — Heirloom's world-first architectural primitive.
-- See /THREAD.md for the canonical product/architectural design.
--
-- A Thread is a perpetual, append-only, multi-author, multi-generational
-- archive. Members span generations. Entries can be time-locked to release
-- on dates, ages, or events. The archive is committed to outliving the
-- company via decentralized backups + a successor non-profit.
--
-- This migration introduces the foundational tables. Encryption key
-- management and IPFS pinning records are introduced in subsequent
-- migrations.

-- ============================================================================
-- THREADS — root entity, owned by a bloodline rather than a user
-- ============================================================================

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  -- Family-facing display name. "The Mahmood Family Thread", "The Doe Line".
  name TEXT NOT NULL,
  -- Optional dedication line shown at the head of the archive.
  dedication TEXT,
  -- The user who created the Thread. Cannot be revoked except by Founder
  -- action.
  founder_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  -- Default visibility for new entries when the author doesn't specify.
  default_visibility TEXT NOT NULL DEFAULT 'FAMILY' CHECK (default_visibility IN ('PRIVATE', 'FAMILY', 'DESCENDANTS', 'HISTORIAN')),
  -- Free / Family / Founder-tier — the per-thread plan.
  plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'FAMILY', 'FOUNDER')),
  -- The Founder pledge — when set, this thread has been committed to
  -- the perpetual-archive guarantee.
  founder_pledged_at TEXT,
  -- Lifecycle: ACTIVE while the family is using it, FROZEN if no Founder
  -- successor exists, ARCHIVED when handed off to the successor non-profit.
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_threads_founder ON threads(founder_user_id);
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);

-- ============================================================================
-- THREAD MEMBERS — who can read, write, or inherit
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_members (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  -- Linked to a real user account once the human exists. Can be NULL for
  -- placeholder descendants (e.g., grandchildren not yet born or not yet
  -- of age).
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  -- Identity for placeholder members (until linked to a user_id).
  display_name TEXT NOT NULL,
  email TEXT,
  -- Relationship label, free-text but suggested values: 'founder', 'spouse',
  -- 'child', 'grandchild', 'great-grandchild', 'sibling', 'cousin'.
  relation_label TEXT,
  -- Permission role.
  role TEXT NOT NULL CHECK (role IN ('FOUNDER', 'SUCCESSOR', 'AUTHOR', 'READER', 'PLACEHOLDER')),
  -- For descendants-on-the-list: the age at which they auto-promote to
  -- the configured target_role. NULL means immediate access.
  age_gate_years INTEGER,
  birth_date TEXT,
  target_role TEXT CHECK (target_role IN ('AUTHOR', 'READER')),
  -- Cryptographic identity, when present.
  public_key TEXT,
  -- Audit — the member record who granted this membership.
  granted_by_member_id TEXT REFERENCES thread_members(id) ON DELETE SET NULL,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Revocations are append-only — we set revoked_at, never delete.
  revoked_at TEXT,
  revoked_by_member_id TEXT REFERENCES thread_members(id) ON DELETE SET NULL,
  -- Cached computed fields for the bloodline view.
  generation_offset INTEGER NOT NULL DEFAULT 0,
  parent_member_id TEXT REFERENCES thread_members(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_thread_members_thread ON thread_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_members_user ON thread_members(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_members_role ON thread_members(thread_id, role);
CREATE INDEX IF NOT EXISTS idx_thread_members_active ON thread_members(thread_id, revoked_at);

-- ============================================================================
-- THREAD ENTRIES — append-only content
-- ============================================================================

CREATE TABLE IF NOT EXISTS thread_entries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  -- The member record (not user_id) — preserves attribution even if the
  -- user account is deleted.
  author_member_id TEXT NOT NULL REFERENCES thread_members(id) ON DELETE RESTRICT,
  -- Display title for the entry (optional but encouraged).
  title TEXT,
  -- Body text — for text entries, the prose; for media entries, the caption
  -- / context. Encrypted at rest with the thread's family key.
  body_ciphertext TEXT,
  body_iv TEXT,
  body_auth_tag TEXT,
  -- Media references (R2 keys). Encrypted with the same family key.
  voice_recording_id TEXT REFERENCES voice_recordings(id) ON DELETE SET NULL,
  memory_id TEXT REFERENCES memories(id) ON DELETE SET NULL,
  -- Visibility level. Defaults to the thread's default_visibility but
  -- can be overridden per entry.
  visibility TEXT NOT NULL DEFAULT 'FAMILY' CHECK (visibility IN ('PRIVATE', 'FAMILY', 'DESCENDANTS', 'HISTORIAN')),
  -- Era / context — optional. Stored as a year (1962) or a text label
  -- ("the year I was 14"). Used for era-browse views.
  era_label TEXT,
  era_year INTEGER,
  -- The 30-day mutability grace window. After this, the entry is
  -- immutable except via amendments (see entry_amendments).
  mutable_until TEXT NOT NULL,
  -- Soft-delete is NEVER allowed. The "remove" UX action only revokes
  -- visibility for non-author readers; the original is preserved.
  visibility_revoked_at TEXT,
  visibility_revoked_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_thread_entries_thread ON thread_entries(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_entries_author ON thread_entries(author_member_id);
CREATE INDEX IF NOT EXISTS idx_thread_entries_era ON thread_entries(thread_id, era_year);

-- ============================================================================
-- ENTRY UNLOCKS — the time-lock primitive
-- ============================================================================

CREATE TABLE IF NOT EXISTS entry_unlocks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id TEXT NOT NULL REFERENCES thread_entries(id) ON DELETE CASCADE,
  -- The lock condition.
  -- DATE: opens at unlock_date.
  -- AGE: opens when target_member_id reaches age_years.
  -- AUTHOR_DEATH: opens after author's death is verified (60-day grace).
  -- RECIPIENT_EVENT: opens when target_member_id self-attests + 1 other
  --   member confirms event_label (e.g., 'wedding', 'first_child').
  -- GENERATION: opens once any member with generation_offset >= target_generation
  --   exists in the thread.
  lock_type TEXT NOT NULL CHECK (lock_type IN ('DATE', 'AGE', 'AUTHOR_DEATH', 'RECIPIENT_EVENT', 'GENERATION')),
  unlock_date TEXT,
  age_years INTEGER,
  target_member_id TEXT REFERENCES thread_members(id) ON DELETE SET NULL,
  event_label TEXT,
  target_generation INTEGER,
  -- The encryption key for the entry payload — held in escrow. Released to
  -- the unlock target once the lock condition is verified.
  encrypted_key TEXT NOT NULL,
  -- Resolution state.
  resolved_at TEXT,
  resolved_by_member_id TEXT REFERENCES thread_members(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entry_unlocks_entry ON entry_unlocks(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_unlocks_pending ON entry_unlocks(lock_type, resolved_at);
CREATE INDEX IF NOT EXISTS idx_entry_unlocks_target ON entry_unlocks(target_member_id);
CREATE INDEX IF NOT EXISTS idx_entry_unlocks_unlock_date ON entry_unlocks(unlock_date) WHERE resolved_at IS NULL;

-- ============================================================================
-- ENTRY COMMENTS — cross-generational dialogue, append-only
-- ============================================================================

CREATE TABLE IF NOT EXISTS entry_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id TEXT NOT NULL REFERENCES thread_entries(id) ON DELETE CASCADE,
  author_member_id TEXT NOT NULL REFERENCES thread_members(id) ON DELETE RESTRICT,
  body_ciphertext TEXT NOT NULL,
  body_iv TEXT NOT NULL,
  body_auth_tag TEXT NOT NULL,
  -- 30-day grace, then immutable.
  mutable_until TEXT NOT NULL,
  visibility_revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entry_comments_entry ON entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_comments_author ON entry_comments(author_member_id);

-- ============================================================================
-- ENTRY AMENDMENTS — visible amendment trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS entry_amendments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id TEXT NOT NULL REFERENCES thread_entries(id) ON DELETE CASCADE,
  amender_member_id TEXT NOT NULL REFERENCES thread_members(id) ON DELETE RESTRICT,
  -- What was changed — one of: 'body', 'title', 'visibility', 'era_label',
  -- 'era_year'.
  field_name TEXT NOT NULL,
  -- For audit: the amendment is the new value. The old value is recoverable
  -- by replaying the amendment chain.
  new_value_ciphertext TEXT NOT NULL,
  new_value_iv TEXT NOT NULL,
  new_value_auth_tag TEXT NOT NULL,
  -- Required reason — visible to all readers.
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entry_amendments_entry ON entry_amendments(entry_id, created_at);

-- ============================================================================
-- ENTRY TAGS — people, places, eras for browse-by-ancestor
-- ============================================================================

CREATE TABLE IF NOT EXISTS entry_tags (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  entry_id TEXT NOT NULL REFERENCES thread_entries(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('PERSON', 'PLACE', 'DATE', 'ERA', 'TOPIC')),
  -- For PERSON tags, link to a thread_member (current or placeholder).
  member_id TEXT REFERENCES thread_members(id) ON DELETE SET NULL,
  -- For everything else, free text.
  label TEXT NOT NULL,
  -- For DATE / ERA tags.
  year_value INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entry_tags_entry ON entry_tags(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_tags_type_label ON entry_tags(tag_type, label);
CREATE INDEX IF NOT EXISTS idx_entry_tags_member ON entry_tags(member_id);

-- ============================================================================
-- SUCCESSOR DESIGNATIONS — chain of administrative succession
-- ============================================================================

CREATE TABLE IF NOT EXISTS successor_designations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  -- Who's being designated as the next admin.
  successor_member_id TEXT NOT NULL REFERENCES thread_members(id) ON DELETE RESTRICT,
  -- Order in the chain — lower number = earlier successor.
  rank INTEGER NOT NULL DEFAULT 1,
  designated_by_member_id TEXT NOT NULL REFERENCES thread_members(id) ON DELETE RESTRICT,
  designated_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- When activated, this successor became the active admin (e.g., on the
  -- prior admin's death).
  activated_at TEXT,
  -- Append-only: a designation can be revoked by a new designation; the
  -- original record remains.
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_successor_designations_thread ON successor_designations(thread_id, rank);
CREATE INDEX IF NOT EXISTS idx_successor_designations_member ON successor_designations(successor_member_id);

-- ============================================================================
-- ARCHIVE PINS — continuity audit log for IPFS / decentralized backups
-- ============================================================================

CREATE TABLE IF NOT EXISTS archive_pins (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  -- Snapshot identifier — usually a content hash of the bundle.
  snapshot_cid TEXT NOT NULL,
  -- Which provider holds this pin: 'pinata', 'web3storage', 'filecoin',
  -- 'r2-archival', 'self-hosted'.
  provider TEXT NOT NULL,
  -- Provider-side pin record id.
  provider_pin_id TEXT,
  -- Bundle metadata.
  entry_count INTEGER NOT NULL,
  bundle_bytes INTEGER NOT NULL,
  bundle_format_version INTEGER NOT NULL DEFAULT 1,
  -- Audit fields.
  pinned_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_verified_at TEXT,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'PINNED' CHECK (status IN ('PINNED', 'VERIFYING', 'EXPIRED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_archive_pins_thread ON archive_pins(thread_id);
CREATE INDEX IF NOT EXISTS idx_archive_pins_cid ON archive_pins(snapshot_cid);
CREATE INDEX IF NOT EXISTS idx_archive_pins_status ON archive_pins(status, last_verified_at);

-- ============================================================================
-- STARTER PROMPTS — re-purposed from the prior gift-prompt scope.
-- These are NOT a Storyworth-style 52-week curriculum; they're a library
-- of suggested prompts that the Thread author can pull from at any time
-- when they don't know what to write.
-- ============================================================================

CREATE TABLE IF NOT EXISTS starter_prompts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  -- Suggested target relation: who the prompt is best asked of.
  -- 'self' = the author writes about themselves.
  suggested_audience TEXT NOT NULL CHECK (suggested_audience IN ('self', 'parent', 'grandparent', 'sibling', 'child', 'any')),
  era_hint TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_starter_prompts_category ON starter_prompts(category);
CREATE INDEX IF NOT EXISTS idx_starter_prompts_audience ON starter_prompts(suggested_audience);

INSERT INTO starter_prompts (prompt_text, category, suggested_audience) VALUES
  ('What is the earliest memory you can recall? Who was there, and what did it smell like?', 'childhood', 'parent'),
  ('Tell us about a meal you grew up eating that nobody wrote down.', 'food', 'parent'),
  ('Walk us through the room you slept in as a child. Smells, sounds, what was under the bed.', 'childhood', 'parent'),
  ('What song instantly brings you back to a specific time or place?', 'music', 'parent'),
  ('Tell the story of meeting the person you spent your life with — the first conversation, not the first date.', 'love', 'parent'),
  ('If you could write a letter to someone you''ve lost, what would the first line be?', 'letters', 'self'),
  ('What is the bravest thing you''ve ever done? It doesn''t have to be physical bravery.', 'courage', 'parent'),
  ('What is something you wish you had done differently? Don''t soften it — just tell it.', 'regret', 'parent'),
  ('Tell us about the first job you ever had. What did it pay? What did you spend it on?', 'work', 'parent'),
  ('Describe the house you grew up in. Don''t list rooms — describe smells, sounds, the way the front door felt.', 'home', 'parent'),
  ('What do you remember about your grandparents? Even small details — a phrase, a smell, a pattern on a couch.', 'family', 'grandparent'),
  ('Tell us one thing about your mother that nobody else knows or remembers anymore.', 'mother', 'parent'),
  ('Tell us one thing about your father that nobody else knows or remembers anymore.', 'father', 'parent'),
  ('Tell us about a specific summer. Not generally — pick one.', 'summer', 'parent'),
  ('Tell us about a time you took a real risk. What was at stake? How did it turn out?', 'courage', 'parent'),
  ('What did your parents teach you about money? What did they get right? What did they get wrong?', 'money', 'parent'),
  ('Where did your family come from before they were here? What''s the family story?', 'heritage', 'parent'),
  ('Pick a photo from your past. Describe it. Who is in it? What was happening just before, just after?', 'memory', 'parent'),
  ('Tell us about a holiday tradition from your family. The specific one — not the generic version.', 'tradition', 'parent'),
  ('Tell us about your child(ren) when they were tiny. A specific moment, not a montage.', 'kids', 'parent'),
  ('What was the hardest year of your life? Tell us what made it hard.', 'difficulty', 'parent'),
  ('What was the happiest day of your life? Be specific — not a category.', 'joy', 'parent'),
  ('What is the best piece of advice you''ve ever been given? Who gave it to you?', 'wisdom', 'parent'),
  ('Tell us about a gift you gave someone that meant a lot. What was it? Why?', 'giving', 'parent'),
  ('What''s a song or tune that comes to you when you''re alone?', 'music', 'parent'),
  ('Tell us about a dream you''ve had more than once. Or one you can''t forget.', 'dreams', 'parent'),
  ('What do you hope for your kids and grandkids? Not the obvious things — the specific ones.', 'hope', 'parent'),
  ('If your descendants only ever knew one thing about you, what would you want it to be?', 'legacy', 'parent');
