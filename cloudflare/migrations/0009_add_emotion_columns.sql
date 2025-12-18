-- Migration 0009: Add emotion columns to voice_recordings, letters, and memories
-- These columns are used by the AI emotion classification feature

-- ============================================
-- VOICE_RECORDINGS - Add emotion column
-- ============================================

ALTER TABLE voice_recordings ADD COLUMN emotion TEXT;

-- ============================================
-- LETTERS - Add emotion column
-- ============================================

ALTER TABLE letters ADD COLUMN emotion TEXT;

-- ============================================
-- MEMORIES - Add emotion column
-- ============================================

ALTER TABLE memories ADD COLUMN emotion TEXT;
