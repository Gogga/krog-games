-- Migration: Add KROG JSON-LD column for neurosymbolic reasoning
-- This stores complete logical formulas, not just labels

ALTER TABLE moves ADD COLUMN IF NOT EXISTS krog_ld JSONB;

-- GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_moves_krog_ld ON moves USING GIN(krog_ld);

-- Comment explaining the column
COMMENT ON COLUMN moves.krog_ld IS 'KROG JSON-LD logical formulas for neurosymbolic AI research';
