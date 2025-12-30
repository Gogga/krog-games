-- Migration: Remove foreign key constraint to allow anonymous game tracking
-- Run this if you already ran 001_create_moves_table.sql with the FK constraint

ALTER TABLE moves DROP CONSTRAINT IF EXISTS moves_game_id_fkey;

-- Add comment explaining why
COMMENT ON COLUMN moves.game_id IS 'Game ID - either a UUID from games table or anon_<roomId> for anonymous games';
