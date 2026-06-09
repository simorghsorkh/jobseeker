export type AchievementCategory = "applications" | "interviews" | "streak" | "goals" | "learning";
export type AchievementRarity   = "common" | "rare" | "epic" | "legendary";

export interface AchievementDef {
  id:          string;
  title:       string;
  description: string;
  icon:        string;
  xp:          number;
  category:    AchievementCategory;
  rarity:      AchievementRarity;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Applications ─────────────────────────────────────────
  { id: "first_application", title: "First Step",        description: "Submit your first job application",    icon: "🚀", xp: 50,   category: "applications", rarity: "common"    },
  { id: "apps_5",            title: "Getting Started",   description: "Submit 5 applications",                icon: "⭐", xp: 100,  category: "applications", rarity: "common"    },
  { id: "apps_10",           title: "On a Roll",         description: "Submit 10 applications",               icon: "🔥", xp: 200,  category: "applications", rarity: "common"    },
  { id: "apps_25",           title: "Dedicated Hunter",  description: "Submit 25 applications",               icon: "💪", xp: 400,  category: "applications", rarity: "rare"      },
  { id: "apps_50",           title: "Job Machine",       description: "Submit 50 applications",               icon: "⚡", xp: 800,  category: "applications", rarity: "epic"      },
  { id: "apps_100",          title: "Century Club",      description: "Submit 100 applications",              icon: "👑", xp: 2000, category: "applications", rarity: "legendary" },
  // ── Interviews ───────────────────────────────────────────
  { id: "first_interview",   title: "Interview Ready",   description: "Get your first interview",             icon: "🎯", xp: 150,  category: "interviews",   rarity: "common"    },
  { id: "interviews_5",      title: "Interview Pro",     description: "Complete 5 interviews",                icon: "🎤", xp: 500,  category: "interviews",   rarity: "rare"      },
  { id: "interviews_10",     title: "Interview Expert",  description: "Complete 10 interviews",               icon: "🏅", xp: 1000, category: "interviews",   rarity: "epic"      },
  // ── Streaks ──────────────────────────────────────────────
  { id: "streak_3",          title: "Warm Up",           description: "Stay active 3 days in a row",          icon: "🌱", xp: 75,   category: "streak",       rarity: "common"    },
  { id: "streak_7",          title: "Week Warrior",      description: "Stay active 7 days in a row",          icon: "🔥", xp: 200,  category: "streak",       rarity: "rare"      },
  { id: "streak_14",         title: "Two Weeks Strong",  description: "Stay active 14 days in a row",         icon: "⚡", xp: 500,  category: "streak",       rarity: "epic"      },
  { id: "streak_30",         title: "Month Master",      description: "Stay active 30 days in a row",         icon: "🏆", xp: 1200, category: "streak",       rarity: "legendary" },
  // ── Goals ────────────────────────────────────────────────
  { id: "first_goal",        title: "Goal Setter",       description: "Set your first goal",                  icon: "🎯", xp: 30,   category: "goals",        rarity: "common"    },
  { id: "goal_completed",    title: "Goal Crusher",      description: "Complete your first goal",             icon: "✅", xp: 300,  category: "goals",        rarity: "rare"      },
  { id: "goals_5",           title: "Overachiever",      description: "Complete 5 goals",                     icon: "🌟", xp: 800,  category: "goals",        rarity: "epic"      },
  // ── Learning ─────────────────────────────────────────────
  { id: "first_lesson",      title: "Learner",           description: "Log your first lesson learned",        icon: "📚", xp: 100,  category: "learning",     rarity: "common"    },
  { id: "interview_qa_10",   title: "Well Prepared",     description: "Add 10 interview Q&A pairs",           icon: "💡", xp: 200,  category: "learning",     rarity: "rare"      },
];

// ── XP / Level system ────────────────────────────────────────────────────────
// Index = level-1 ; value = XP needed to reach that level
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000, 8500];
export const LEVEL_TITLES = [
  "Rookie",          // 1
  "Explorer",        // 2
  "Job Seeker",      // 3
  "Applicant",       // 4
  "Candidate",       // 5
  "Contender",       // 6
  "Pro Hunter",      // 7
  "Expert",          // 8
  "Elite",           // 9
  "Legend",          // 10
  "Champion",        // 11+
];

export function getLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

export function getLevelProgress(xp: number): { current: number; needed: number; percent: number; level: number } {
  const level  = getLevel(xp);
  const curMin = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const curMax = LEVEL_THRESHOLDS[level]     ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
  const current = xp - curMin;
  const needed  = curMax - curMin;
  return {
    level,
    current,
    needed,
    percent: Math.min(100, needed > 0 ? Math.round((current / needed) * 100) : 100),
  };
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common:    "text-slate-400 border-slate-400/30 bg-slate-400/10",
  rare:      "text-blue-400  border-blue-400/30  bg-blue-400/10",
  epic:      "text-violet-400 border-violet-400/30 bg-violet-400/10",
  legendary: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  applications: "Applications",
  interviews:   "Interviews",
  streak:       "Streaks",
  goals:        "Goals",
  learning:     "Learning",
};

export function getAchievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
