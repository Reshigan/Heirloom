-- B: viral mechanism — recipient signup attribution + share-this-note path.

-- B1 (Day 12): recipient signup attribution. Records WHERE an invite originated
-- so /join?code= can attribute conversion back to the delivering letter.
--   source = 'inherit' : minted from /inherit/:token — a delivered letter drove
--                         the signup (the recipient→author loop).
--   source = 'manual'  : the author invited someone directly from the Family page.
--   source = NULL      : legacy rows minted before this column existed.
-- source_letter_id ties an inherit-minted invite back to the specific letter
-- shared with that recipient (best-effort: the first letter they were sent).
ALTER TABLE family_invites ADD COLUMN source TEXT;
ALTER TABLE family_invites ADD COLUMN source_letter_id TEXT REFERENCES letters(id) ON DELETE SET NULL;

-- B4 (Day 23): share-this-note read-only path. A share token unlocks a single
-- letter for unauthenticated readers. Revocable by the author. The token is an
-- opaque high-entropy string (not the letter id) so a leaked link can be killed
-- without rotating the letter, and the letter id is never exposed in the URL.
CREATE TABLE IF NOT EXISTS letter_share_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  letter_id TEXT NOT NULL REFERENCES letters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  revoked_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_letter_share_tokens_token ON letter_share_tokens(token);