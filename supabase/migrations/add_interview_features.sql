-- Migration: Add interview rounds, Q&A, and lessons learned

-- 1. lessons_learned on applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- 2. Interview rounds (per-stage results)
CREATE TABLE IF NOT EXISTS interview_rounds (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_name     TEXT NOT NULL,
  result         TEXT CHECK (result IN ('passed', 'failed', 'pending', 'rejected')),
  interview_date DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own interview rounds" ON interview_rounds;
CREATE POLICY "Users manage own interview rounds"
  ON interview_rounds FOR ALL USING (auth.uid() = user_id);

-- 3. Interview Q&A
CREATE TABLE IF NOT EXISTS interview_questions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  answer         TEXT,
  category       TEXT DEFAULT 'general',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own interview questions" ON interview_questions;
CREATE POLICY "Users manage own interview questions"
  ON interview_questions FOR ALL USING (auth.uid() = user_id);
