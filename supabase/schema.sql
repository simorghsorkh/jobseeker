-- ============================================================
-- JobFlow AI — Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  company_name        TEXT NOT NULL,
  job_title           TEXT NOT NULL,
  job_url             TEXT,
  job_description     TEXT,
  industry            TEXT,
  employment_type     TEXT CHECK (employment_type IN ('full_time','part_time','contract','freelance','internship','temporary')),
  seniority_level     TEXT CHECK (seniority_level IN ('intern','junior','mid','senior','lead','manager','director','vp','c_level')),
  salary_min          INTEGER,
  salary_max          INTEGER,
  salary_currency     TEXT NOT NULL DEFAULT 'USD',
  location            TEXT,
  work_mode           TEXT CHECK (work_mode IN ('remote','hybrid','onsite')),
  country             TEXT,
  city                TEXT,
  recruiter_name      TEXT,
  recruiter_linkedin  TEXT,
  contact_email       TEXT,

  -- Application info
  status              TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved','preparing','applied','hr_review','interview_scheduled','technical_interview','final_interview','offer','rejected','accepted','ghosted')),
  application_date    DATE,
  source              TEXT CHECK (source IN ('linkedin','indeed','glassdoor','company_website','referral','recruiter','job_board','other')),
  cv_version          TEXT,
  cover_letter_used   TEXT,
  portfolio_link      TEXT,
  motivation_notes    TEXT,
  why_this_role       TEXT,
  match_score         INTEGER CHECK (match_score >= 0 AND match_score <= 100),

  -- Extended fields
  description_language TEXT,
  dutch_required       BOOLEAN,
  initial_notes        TEXT,

  -- AI fields
  ai_summary          TEXT,
  ai_match_score      INTEGER CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  ai_interview_prep   TEXT,

  -- Meta
  is_bookmarked       BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
  priority            INTEGER NOT NULL DEFAULT 0,
  tags                TEXT[] NOT NULL DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_updated_at ON applications(updated_at DESC);
CREATE INDEX idx_applications_is_archived ON applications(is_archived);
CREATE INDEX idx_applications_is_bookmarked ON applications(is_bookmarked);

-- ============================================================
-- STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS status_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note            TEXT
);

CREATE INDEX idx_status_history_application_id ON status_history(application_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('status_change','note_added','file_uploaded','reminder_set','ai_generated','email_sent','interview_scheduled','offer_received','application_created')),
  title           TEXT NOT NULL,
  description     TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_application_id ON activities(application_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT,
  content         TEXT NOT NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_application_id ON notes(application_id);

-- ============================================================
-- APPLICATION FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS application_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_url        TEXT,
  file_size       INTEGER,
  file_type       TEXT,
  category        TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('resume','cover_letter','certificate','portfolio','assignment','other')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_files_application_id ON application_files(application_id);

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'follow_up' CHECK (type IN ('follow_up','interview','deadline','recruiter_reply','other')),
  title           TEXT NOT NULL,
  description     TEXT,
  due_date        TIMESTAMPTZ NOT NULL,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_application_id ON reminders(application_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Tags policies
CREATE POLICY "Users manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users manage own applications" ON applications FOR ALL USING (auth.uid() = user_id);

-- Status history policies
CREATE POLICY "Users view own status history" ON status_history FOR ALL USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users manage own activities" ON activities FOR ALL USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users manage own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- Files policies
CREATE POLICY "Users manage own files" ON application_files FOR ALL USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users manage own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-files', 'application-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own files" ON storage.objects
  FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
