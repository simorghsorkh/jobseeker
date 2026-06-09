-- ============================================================
-- Gamification: user_stats, user_achievements, user_goals
-- ============================================================

-- 1. User stats (XP, level, streak)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp         INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_stats_own" ON user_stats;
CREATE POLICY "user_stats_own" ON user_stats
  FOR ALL USING (auth.uid() = user_id);

-- 2. Earned badges
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_own" ON user_achievements;
CREATE POLICY "user_achievements_own" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

-- 3. User goals
CREATE TABLE IF NOT EXISTS user_goals (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  goal_type      TEXT NOT NULL DEFAULT 'custom',
  target_value   INTEGER NOT NULL DEFAULT 1,
  current_value  INTEGER NOT NULL DEFAULT 0,
  deadline       DATE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_goals_own" ON user_goals;
CREATE POLICY "user_goals_own" ON user_goals
  FOR ALL USING (auth.uid() = user_id);
