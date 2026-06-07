-- The giver gets a 10% thank-you discount, so what Stripe collects differs from
-- the voucher's face value (`amount`, which the recipient redeems in full).
-- Record the actually-charged amount so admin revenue reflects collected money,
-- not face value. Nullable: old rows fall back to `amount` via COALESCE.
ALTER TABLE gift_vouchers ADD COLUMN charged_amount INTEGER;
