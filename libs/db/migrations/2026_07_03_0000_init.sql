-- OfferLens initial schema
-- Migration: 2026_07_03_0000_init

CREATE TABLE IF NOT EXISTS demo_usage (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  urls_processed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_usage_session ON demo_usage (session_id);

CREATE TABLE IF NOT EXISTS analyses (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_session ON analyses (session_id);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses (url);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses (created_at DESC);
