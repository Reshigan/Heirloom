-- 0058_book_orders_config.sql
-- The Book Builder wizard collects cover choice, title, subtitle, dedication,
-- and a hand-picked set of memories/letters/voice recordings — but checkout
-- only ever forwarded ship_to + cover_type, so paid orders silently rendered
-- with placeholder front matter and *every* entry the purchaser owned.
--
-- Add the missing config columns so the row created on
-- checkout.session.completed carries the purchaser's actual choices through
-- to renderBookPdf().

ALTER TABLE book_orders ADD COLUMN cover_type TEXT NOT NULL DEFAULT 'hardcover'
  CHECK (cover_type IN ('hardcover', 'softcover'));
ALTER TABLE book_orders ADD COLUMN title TEXT;
ALTER TABLE book_orders ADD COLUMN subtitle TEXT;
ALTER TABLE book_orders ADD COLUMN dedication TEXT;
