-- ============================================================
-- Job Scout: job_alerts + scraped_jobs
-- ============================================================

-- 1. Search alert configurations
CREATE TABLE IF NOT EXISTS job_alerts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  keywords       TEXT NOT NULL,         -- e.g. "product manager"
  location       TEXT,                  -- e.g. "Amsterdam" (blank = remote/any)
  sources        TEXT[] DEFAULT '{}',   -- ['indeed_rss','remotive','remoteok','custom_rss','company_pages']
  indeed_rss_url TEXT,                  -- paste your Indeed RSS URL here
  custom_rss_urls TEXT[] DEFAULT '{}',  -- any extra RSS feeds
  company_page_urls TEXT[] DEFAULT '{}', -- company career pages (auto-detects Greenhouse/Lever/generic)
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "job_alerts_own" ON job_alerts;
CREATE POLICY "job_alerts_own" ON job_alerts FOR ALL USING (auth.uid() = user_id);

-- 2. Scraped job listings
CREATE TABLE IF NOT EXISTS scraped_jobs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_id      UUID REFERENCES job_alerts(id) ON DELETE CASCADE NOT NULL,
  source        TEXT NOT NULL,   -- 'indeed','remotive','remoteok','custom'
  title         TEXT NOT NULL,
  company       TEXT,
  location      TEXT,
  url           TEXT NOT NULL,
  description   TEXT,
  salary        TEXT,
  tags          TEXT[] DEFAULT '{}',
  posted_at     TIMESTAMPTZ,
  is_new        BOOLEAN NOT NULL DEFAULT TRUE,
  is_saved      BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed  BOOLEAN NOT NULL DEFAULT FALSE,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url)
);
ALTER TABLE scraped_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scraped_jobs_own" ON scraped_jobs;
CREATE POLICY "scraped_jobs_own" ON scraped_jobs FOR ALL USING (auth.uid() = user_id);
