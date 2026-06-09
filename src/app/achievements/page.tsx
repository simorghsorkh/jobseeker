"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Flame, Star, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/client";
import {
  getUserStats,
  ensureUserStats,
  getEarnedAchievements,
} from "@/lib/db/gamification";
import {
  ACHIEVEMENTS,
  CATEGORY_LABELS,
  RARITY_COLORS,
  getLevelProgress,
  getLevelTitle,
  type AchievementCategory,
} from "@/lib/gamification/achievements";
import { cn } from "@/lib/utils";
import type { UserStats, UserAchievement } from "@/lib/types";

const CATEGORY_ORDER: AchievementCategory[] = [
  "applications",
  "interviews",
  "streak",
  "goals",
  "learning",
];

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  applications: "📋",
  interviews:   "🎤",
  streak:       "🔥",
  goals:        "🎯",
  learning:     "📚",
};

export default function AchievementsPage() {
  const [stats,        setStats]        = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [s, earned] = await Promise.all([
      ensureUserStats(user.id).then(() => getUserStats(user.id)),
      getEarnedAchievements(user.id),
    ]);
    setStats(s);
    setAchievements(earned);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const earnedSet = new Set(achievements.map((a) => a.achievement_id));
  const earnedMap = Object.fromEntries(achievements.map((a) => [a.achievement_id, a]));

  const filteredAchievements = ACHIEVEMENTS.filter(
    (a) => activeCategory === "all" || a.category === activeCategory
  );

  const progress = stats ? getLevelProgress(stats.total_xp) : null;

  return (
    <AppLayout title="Achievements">
      <div className="p-6 space-y-6">

        {/* Stats banner */}
        {!loading && stats && progress && (
          <div className="rounded-xl border border-border bg-gradient-to-br from-violet-500/10 via-card to-card p-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Level */}
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/20 text-2xl font-bold text-violet-500">
                  {progress.level}
                </div>
                <div>
                  <p className="text-lg font-bold">Level {progress.level}</p>
                  <p className="text-sm text-muted-foreground">{getLevelTitle(progress.level)}</p>
                </div>
              </div>

              {/* XP bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-violet-500" />{stats.total_xp.toLocaleString()} XP</span>
                  <span>{progress.current}/{progress.needed} to Lv.{progress.level + 1}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Streak + badges */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Flame className={cn("h-4 w-4", stats.current_streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                    <span className="text-xl font-bold">{stats.current_streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-xl font-bold">{achievements.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <Star className="h-4 w-4 text-blue-400" />
                    <span className="text-xl font-bold">{stats.longest_streak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Best streak</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            All ({ACHIEVEMENTS.length})
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const catAchs  = ACHIEVEMENTS.filter((a) => a.category === cat);
            const catEarned = catAchs.filter((a) => earnedSet.has(a.id)).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]} ({catEarned}/{catAchs.length})
              </button>
            );
          })}
        </div>

        {/* Achievement grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((def, i) => {
            const isEarned   = earnedSet.has(def.id);
            const earnedData = earnedMap[def.id];

            return (
              <motion.div
                key={def.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "relative rounded-xl border p-4 transition-all",
                  isEarned
                    ? cn("border", RARITY_COLORS[def.rarity])
                    : "border-border bg-muted/20 opacity-50"
                )}
              >
                {/* Rarity label */}
                <div className="absolute top-2.5 right-2.5">
                  <span className={cn(
                    "text-xs font-medium capitalize px-1.5 py-0.5 rounded-full",
                    isEarned ? RARITY_COLORS[def.rarity] : "text-muted-foreground bg-muted"
                  )}>
                    {def.rarity}
                  </span>
                </div>

                {/* Icon */}
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl text-2xl mb-3",
                  isEarned ? "bg-background/60" : "bg-muted/40"
                )}>
                  {isEarned ? def.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                </div>

                {/* Info */}
                <p className="text-sm font-semibold mb-0.5">{def.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{def.description}</p>

                {/* XP */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-violet-400" />
                    <span className="text-xs font-medium text-violet-400">+{def.xp} XP</span>
                  </div>
                  {isEarned && earnedData && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(earnedData.earned_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Earned glow */}
                {isEarned && (
                  <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-white/5" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
