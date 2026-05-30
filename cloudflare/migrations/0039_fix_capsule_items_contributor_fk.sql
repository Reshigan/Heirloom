-- Fix: capsule_items.contributor_id had a foreign key to capsule_contributors(id),
-- but both the insert (capsules.ts POST /:id/items) and the read path
-- (LEFT JOIN users u ON ci.contributor_id = u.id) treat it as a *user* id. The
-- creator of a capsule is never a capsule_contributors row, so adding an item to
-- your own capsule violated the FK and returned 500. Rebuild the table with
-- contributor_id referencing users(id), matching how the code actually uses it.
--
-- defer_foreign_keys (not `foreign_keys=OFF`, which is a no-op inside D1's
-- per-migration transaction) holds checks until commit so the rebuild is atomic.
PRAGMA defer_foreign_keys = true;

CREATE TABLE capsule_items_new (
  id TEXT PRIMARY KEY,
  capsule_id TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  file_key TEXT,
  file_url TEXT,
  encrypted INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (capsule_id) REFERENCES time_capsules(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES users(id)
);

INSERT INTO capsule_items_new (id, capsule_id, contributor_id, item_type, title, content, file_key, file_url, encrypted, created_at)
  SELECT id, capsule_id, contributor_id, item_type, title, content, file_key, file_url, encrypted, created_at
  FROM capsule_items;

DROP TABLE capsule_items;
ALTER TABLE capsule_items_new RENAME TO capsule_items;
