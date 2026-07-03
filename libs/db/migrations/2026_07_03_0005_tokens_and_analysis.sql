-- Add token tracking and improve analyses table
-- Migration: 2026_07_03_0005_tokens_and_analysis

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tokens_prompt INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tokens_completion INTEGER DEFAULT 0;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tokens_total INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses (session_id);
