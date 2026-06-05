-- 0046_book_orders_lulu.sql
-- Rebuild book_orders for the Lulu Direct print pipeline.
-- The original schema (0033_heirloom_v2.sql) tracked an old UI flow
-- with a different column set. This migration drops it and recreates
-- the table with the columns expected by services/book.ts.

DROP TABLE IF EXISTS book_orders;

CREATE TABLE book_orders (
  id                     TEXT PRIMARY KEY,
  -- purchaser (always required)
  purchaser_user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- optional link to a prompt subscription thread
  prompt_subscription_id TEXT,
  -- shipping
  ship_to_name           TEXT NOT NULL,
  ship_to_address_json   TEXT NOT NULL,  -- ShippingAddress JSON
  -- entry selection
  thread_id              TEXT,           -- which thread to draw entries from
  entry_filter_json      TEXT,           -- { from?, to?, member_ids?, era_year? } JSON
  -- pricing
  currency               TEXT NOT NULL DEFAULT 'USD',
  total_cents            INTEGER,        -- set by Lulu cost callback
  -- state machine: PENDING → COMPILING → PRINTING → SHIPPED | FAILED
  status                 TEXT NOT NULL DEFAULT 'PENDING'
                           CHECK (status IN ('PENDING','COMPILING','PRINTING','SHIPPED','FAILED')),
  -- Lulu integration
  lulu_print_job_id      TEXT,
  lulu_status            TEXT,
  tracking_url           TEXT,
  -- R2 keys for the generated PDFs
  interior_pdf_key       TEXT,
  cover_pdf_key          TEXT,
  -- error message on FAILED
  error                  TEXT,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_book_orders_user   ON book_orders(purchaser_user_id);
CREATE INDEX idx_book_orders_status ON book_orders(status);
