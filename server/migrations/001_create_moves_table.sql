-- Migration: Create moves table for R-type annotation persistence
-- Run this in Supabase SQL Editor or via migration tool

CREATE TABLE IF NOT EXISTS moves (
  id SERIAL PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('white', 'black')),
  san TEXT NOT NULL,
  from_square TEXT NOT NULL,
  to_square TEXT NOT NULL,
  piece TEXT NOT NULL,
  captured TEXT,
  promotion TEXT,
  flags TEXT,
  r_type TEXT NOT NULL,
  r_type_description TEXT,
  conditions TEXT,
  fide_ref TEXT,
  move_type TEXT,
  fen_after TEXT,
  is_check BOOLEAN DEFAULT FALSE,
  is_checkmate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id);
CREATE INDEX IF NOT EXISTS idx_moves_r_type ON moves(r_type);
CREATE INDEX IF NOT EXISTS idx_moves_piece ON moves(piece);
CREATE INDEX IF NOT EXISTS idx_moves_created_at ON moves(created_at);

-- Composite index for game move ordering
CREATE INDEX IF NOT EXISTS idx_moves_game_order ON moves(game_id, move_number, color);

-- Comment on table
COMMENT ON TABLE moves IS 'Chess moves with KROG R-type annotations for neurosymbolic AI research';
COMMENT ON COLUMN moves.r_type IS 'KROG rule type classification (e.g., R3_path_dependent, R11_discrete_jump)';
COMMENT ON COLUMN moves.conditions IS 'JSON array of move conditions from KROG validation';
COMMENT ON COLUMN moves.fide_ref IS 'FIDE Laws of Chess article reference';
