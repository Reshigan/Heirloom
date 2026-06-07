-- Migration: Letter delivered_at
-- Milestone letters are held sealed with no scheduled date and released by hand
-- when the family judges the milestone has arrived (POST /letters/:id/release),
-- or revealed by the recipient (POST /letters/:id/open). delivered_at records
-- the moment the letter left the seal so the recipient nudge (awaiting-me) stops
-- showing it and the author's list reads "released". Distinct from the per-
-- recipient letter_deliveries rows, which track each email's send status.

ALTER TABLE letters ADD COLUMN delivered_at TEXT;
