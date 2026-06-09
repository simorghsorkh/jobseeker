"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Flame, Trophy, Star, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  getUserStats,
  ensureUserStats,
  recordActivityToday,
  getEarnedAchievements,
  checkAndAwardAchievements,
} from "@/lib/db/gamification";
import {
  getLevelProgress,
  getLevelTitle,
  getAchievementById,
  RARITY_COLORS,
} from "@/lib/gamification/achievements";
import type { UserStats, UserAchievement, Application } from "@/lib/types";

interface Props {
  applications: Application[];
}

export function GamificationWidget({ applications }: Props) {
  const [stats,        setStats]        = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Ensure row exists (silently fails if table missing)
      const s = await ensureUserStats(user.id);
      setStats(s);

      // Record today's activity (streak) - ignore errors
      try { await recordActivityToday(user.id); } catch { /* table may not exist yet */ }

      // Re-fetch stats after recording
      try {
        const refreshed = await getUserStats(user.id);
        if (refreshed) setStats(refreshed);
      } catch { /* ignore */ }

      // Count data for achievements
      const appCount       = applications.length;
      const interviewCount = applications.filter((a) =>
        ["interview_scheduled", "technical_interview", "final_interview"].includes(a.status)
      ).length;
      const lessonCount = applications.filter((a) => a.lessons_learned).length;

      // Check + award achievements (silently fails if table missing)
      try {
        const currentStats = await getUserStats(user.id);
        const newIds = await checkAndAwardAchievements(user.id, {
          appCount,
          interviewCount,
          streak:             currentStats?.current_streak ?? 0,
          goalCreatedCount:   0,
          goalCompletedCount: 0,
          lessonCount,
          qaCount:            0,
        });
        newIds.forEach((id) => {
          const def = getAchievementById(id);
          if (def) {
            toast.success(`${def.icon} Badge earned: ${def.title} (+${def.xp} XP)`, {
              duration: 4000,
              style: { fontWeight: 600 },
            });
          }
        });
        const earned = await getEarnedAchievements(user.id);
        setAchievements(earned);
      } catch { /* achievements table may not exist yet */ }
    } catch {
      /* fail silently */
    } finally {
      setLoading(false);
    }
  }, [applications]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    );
  }

  // Show rich demo/preview when DB tables not yet set up
  if (!stats) {
    return (
      <div className="rounded-xl border border-violet-500/25 bg-card p-5 relative overflow-hidden">
        {/* "Preview" ribbon */}
        <div className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded-full">
          Preview
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
            <Zap className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Level 5 · Contender</p>
            <p className="text-xs text-muted-foreground">This is what you&apos;ll unlock 🚀</p>
          </div>
        </div>

        {/* Demo XP bar – 72% full */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="text-violet-400 font-medium">1,260 XP</span>
            <span>360/500 to Lv.6</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
              initial={{ width: 0 }}
              animate={{ width: "72%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold">7</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">8</span>
            <span className="text-xs text-muted-foreground">badges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-muted-foreground">Best: 12d</span>
          </div>
        </div>

        {/* Demo badges */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Sample badges you can earn</p>
          <div className="flex items-center gap-1.5">
            {["🚀","⭐","🔥","🎯","💪","🌱","🔥","🏅"].map((icon, i) => (
              <div key={i} className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-400/10 text-base">
                {icon}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
          <Zap className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
          <p className="text-xs text-violet-400">
            Run <code className="font-mono bg-violet-500/20 px-1 rounded">add_gamification.sql</code> in Supabase SQL Editor to activate
          </p>
        </div>
      </div>
    );
  }

  const progress = getLevelProgress(stats.total_xp);
  const recentBadges = achievements.slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
            <Zap className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Level {progress.level}</p>
            <p className="text-xs text-muted-foreground">{getLevelTitle(progress.level)}</p>
          </div>
        </div>
        <Link
          href="/achievements"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{stats.total_xp.toLocaleString()} XP</span>
          <span>{progress.current}/{progress.needed} to Lv.{progress.level + 1}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress.percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Streak + badges count */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Flame className={cn("h-4 w-4", stats.current_streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
          <span className="text-sm font-semibold">{stats.current_streak}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">{achievements.length}</span>
          <span className="text-xs text-muted-foreground">badges</span>
        </div>
        {stats.longest_streak > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-muted-foreground">Best: {stats.longest_streak}d</span>
          </div>
        )}
      </div>

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Recent badges</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <AnimatePresence>
              {recentBadges.map((a) => {
                const def = getAchievementById(a.achievement_id);
                if (!def) return null;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border text-base",
                      RARITY_COLORS[def.rarity]
                    )}
                    title={`${def.title} — ${def.description}`}
                  >
                    {def.icon}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {achievements.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Start adding applications to earn your first badge! 🚀
        </p>
      )}
    </div>
  );
}
