-- OfferLens BYOK: user_api_keys
-- Migration: 2026_07_03_0003_user_api_keys

CREATE TABLE IF NOT EXISTS user_api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  base_url TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  key_encrypted TEXT NOT NULL,
  key_hint TEXT NOT NULL DEFAULT '',  -- last 4 chars for UI display
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys (user_id, is_active);

-- Trigger: auto-update updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_api_keys_updated_at') THEN
    CREATE TRIGGER set_user_api_keys_updated_at
      BEFORE UPDATE ON user_api_keys
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
