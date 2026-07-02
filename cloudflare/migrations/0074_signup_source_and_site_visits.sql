-- Zero-cost marketing measurement.
--
-- signup_source: where the account came from (?ref= on the landing URL, carried
-- through signup — 'fb', 'bsky', later 'seo' etc.). NULL = direct/unknown.
ALTER TABLE users ADD COLUMN signup_source TEXT;

-- site_visits: first-party page-view aggregate (no cookies, no IP, no UA — just
-- day × ref × path counters). Enough to answer "do posts drive clicks" without
-- any external analytics service.
CREATE TABLE IF NOT EXISTS site_visits (
  day  TEXT NOT NULL,              -- YYYY-MM-DD (UTC)
  ref  TEXT NOT NULL DEFAULT '',   -- ?ref= tag ('' = direct)
  path TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ref, path)
);
