-- Migration: Soft-delete for family members with 7-day grace period.
-- Deleting a member marks deleted_at; content associated to them is
-- cascade-deleted only after the grace window expires.

ALTER TABLE family_members ADD COLUMN deleted_at TEXT; -- ISO 8601; NULL = active
