-- Migration: Letter milestone label
-- "On a milestone" delivery: the letter is held sealed (normalised onto a
-- SCHEDULED trigger with a null scheduled_date) and opened by the family when
-- the named milestone arrives. milestone_label records which milestone the
-- letter is waiting for (e.g. "her 18th birthday", "his wedding day") so the
-- option is meaningful rather than an undated, unlabelled seal.

ALTER TABLE letters ADD COLUMN milestone_label TEXT;
