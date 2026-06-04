-- Migration: Admin settings table for global app configuration

CREATE TABLE IF NOT EXISTS admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authenticated users can read (AI route needs to read the model selection)
-- Authenticated users can also write (personal app — the owner is the only user)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read settings"  ON admin_settings;
DROP POLICY IF EXISTS "Authenticated users write settings" ON admin_settings;

CREATE POLICY "Authenticated users read settings"
  ON admin_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users write settings"
  ON admin_settings FOR ALL TO authenticated USING (true);

-- Seed defaults
INSERT INTO admin_settings (key, value) VALUES
  ('ai_model',   'anthropic/claude-3.5-sonnet'),
  ('ai_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
