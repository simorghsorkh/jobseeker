import { createClient } from "@/lib/supabase/client";
import { getLevel, getAchievementById } from "@/lib/gamification/achievements";
import type { UserStats, UserAchievement, UserGoal } from "@/lib/types";

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

export async function ensureUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient();
  // upsert with ignoreDuplicates so we don't overwrite existing row
  await supabase
    .from("user_stats")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  const stats = await getUserStats(userId);
  return stats ?? ({
    user_id: userId,
    total_xp: 0,
    level: 1,
    current_streak: 0,
    longest_streak: 0,
    last_activity_date: null,
    updated_at: new Date().toISOString(),
  } as UserStats);
}

export async function addXP(userId: string, xp: number): Promise<void> {
  const supabase = createClient();
  const stats = await getUserStats(userId);
  const newXp = (stats?.total_xp ?? 0) + xp;
  await supabase.from("user_stats").upsert(
    { user_id: userId, total_xp: newXp, level: getLevel(newXp), updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

/** Call once per day; updates streak. */
export async function recordActivityToday(userId: string): Promise<void> {
  const supabase  = createClient();
  const today     = new Date().toISOString().split("T")[0];
  const stats     = await getUserStats(userId);
  if (!stats) return;
  if (stats.last_activity_date === today) return; // already done

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr      = yesterday.toISOString().split("T")[0];

  const newStreak  = stats.last_activity_date === yStr ? (stats.current_streak ?? 0) + 1 : 1;
  const longest    = Math.max(stats.longest_streak ?? 0, newStreak);

  await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      current_streak: newStreak,
      longest_streak: longest,
      last_activity_date: today,
      // also add daily bonus XP
      total_xp: (stats.total_xp ?? 0) + 10,
      level: getLevel((stats.total_xp ?? 0) + 10),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

// ── Achievements ──────────────────────────────────────────────────────────────

export async function getEarnedAchievements(userId: string): Promise<UserAchievement[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  return data ?? [];
}

/** Award an achievement. Returns true if newly awarded, false if already had it. */
export async function awardAchievement(userId: string, achievementId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_achievements")
    .insert({ user_id: userId, achievement_id: achievementId });
  if (error) return false; // unique constraint → already earned
  const def = getAchievementById(achievementId);
  if (def) await addXP(userId, def.xp);
  return true;
}

/**
 * Check all achievement conditions and award any new ones.
 * Returns array of newly-awarded achievement IDs.
 */
export async function checkAndAwardAchievements(
  userId: string,
  counts: {
    appCount:           number;
    interviewCount:     number;
    streak:             number;
    goalCreatedCount:   number;
    goalCompletedCount: number;
    lessonCount:        number;
    qaCount:            number;
  }
): Promise<string[]> {
  const earned = await getEarnedAchievements(userId);
  const earnedSet = new Set(earned.map((e) => e.achievement_id));

  const candidates: string[] = [];
  const check = (id: string, cond: boolean) => { if (cond && !earnedSet.has(id)) candidates.push(id); };

  // Applications
  check("first_application", counts.appCount >= 1);
  check("apps_5",             counts.appCount >= 5);
  check("apps_10",            counts.appCount >= 10);
  check("apps_25",            counts.appCount >= 25);
  check("apps_50",            counts.appCount >= 50);
  check("apps_100",           counts.appCount >= 100);

  // Interviews
  check("first_interview",  counts.interviewCount >= 1);
  check("interviews_5",     counts.interviewCount >= 5);
  check("interviews_10",    counts.interviewCount >= 10);

  // Streaks
  check("streak_3",  counts.streak >= 3);
  check("streak_7",  counts.streak >= 7);
  check("streak_14", counts.streak >= 14);
  check("streak_30", counts.streak >= 30);

  // Goals
  check("first_goal",     counts.goalCreatedCount   >= 1);
  check("goal_completed", counts.goalCompletedCount >= 1);
  check("goals_5",        counts.goalCompletedCount >= 5);

  // Learning
  check("first_lesson",    counts.lessonCount >= 1);
  check("interview_qa_10", counts.qaCount     >= 10);

  const newlyEarned: string[] = [];
  for (const id of candidates) {
    const ok = await awardAchievement(userId, id);
    if (ok) newlyEarned.push(id);
  }
  return newlyEarned;
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createGoal(
  userId: string,
  payload: Pick<UserGoal, "title" | "goal_type" | "target_value" | "deadline">
): Promise<UserGoal | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_goals")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();
  return data ?? null;
}

export async function incrementGoal(goalId: string): Promise<void> {
  const supabase = createClient();
  const { data: goal } = await supabase.from("user_goals").select("current_value, target_value").eq("id", goalId).single();
  if (!goal) return;
  const newVal      = (goal.current_value ?? 0) + 1;
  const isCompleted = newVal >= goal.target_value;
  await supabase.from("user_goals").update({
    current_value: newVal,
    is_completed:  isCompleted,
    completed_at:  isCompleted ? new Date().toISOString() : null,
    updated_at:    new Date().toISOString(),
  }).eq("id", goalId);
}

export async function decrementGoal(goalId: string): Promise<void> {
  const supabase = createClient();
  const { data: goal } = await supabase.from("user_goals").select("current_value").eq("id", goalId).single();
  if (!goal) return;
  const newVal = Math.max(0, (goal.current_value ?? 0) - 1);
  await supabase.from("user_goals").update({
    current_value: newVal,
    is_completed: false,
    completed_at: null,
    updated_at: new Date().toISOString(),
  }).eq("id", goalId);
}

export async function archiveGoal(goalId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("user_goals").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", goalId);
}
