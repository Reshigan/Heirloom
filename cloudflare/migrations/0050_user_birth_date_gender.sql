-- Migration: user birth_date + gender for personalised AI prompts
-- The Listener tailors memory/letter/voice prompts to the author's life stage
-- (age derived from birth_date) and, softly, to gender. Both are optional and
-- nullable — prompts fall back to neutral, life-stage-free phrasing when unset.
-- birth_date is ISO YYYY-MM-DD; gender is a free short string (e.g. 'female',
-- 'male', 'nonbinary', or anything the author types) used only to colour
-- pronoun-light phrasing, never to gate features.

ALTER TABLE users ADD COLUMN birth_date TEXT;
ALTER TABLE users ADD COLUMN gender TEXT;
