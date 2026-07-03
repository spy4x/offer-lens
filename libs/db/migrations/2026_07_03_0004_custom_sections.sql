-- OfferLens custom sections
-- Migration: 2026_07_03_0004_custom_sections

CREATE TABLE IF NOT EXISTS custom_sections (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  position_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_sections_user ON custom_sections (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_sections_order ON custom_sections (user_id, position_order);

-- Trigger: auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_custom_sections_updated_at') THEN
    CREATE TRIGGER set_custom_sections_updated_at
      BEFORE UPDATE ON custom_sections
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
