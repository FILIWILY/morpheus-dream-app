-- Add 'viewed' column to dream_symbols table
-- This tracks which symbols the user has already read

ALTER TABLE dream_symbols 
ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dream_symbols_viewed ON dream_symbols(dream_id, viewed);

COMMENT ON COLUMN dream_symbols.viewed IS 'Tracks if user has viewed this symbol interpretation';

