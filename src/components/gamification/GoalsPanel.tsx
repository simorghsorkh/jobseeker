"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, CheckCircle2, Target, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  getUserGoals,
  createGoal,
  incrementGoal,
  decrementGoal,
  archiveGoal,
  checkAndAwardAchievements,
  getEarnedAchievements,
} from "@/lib/db/gamification";
import { getAchievementById } from "@/lib/gamification/achievements";
import type { UserGoal, GoalType, Application } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  applications_total:   "Total applications submitted",
  applications_weekly:  "Applications this week",
  applications_monthly: "Applications this month",
  interviews_total:     "Total interviews reached",
  custom:               "Custom goal (manual)",
};

interface Props {
  applications: Application[];
}

function computeAutoValue(type: GoalType, apps: Application[]): number | null {
  const now     = new Date();
  const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(); monthAgo.setDate(now.getDate() - 30);

  switch (type) {
    case "applications_total":
      return apps.length;
    case "applications_weekly":
      return apps.filter((a) => new Date(a.created_at) >= weekAgo).length;
    case "applications_monthly":
      return apps.filter((a) => new Date(a.created_at) >= monthAgo).length;
    case "interviews_total":
      return apps.filter((a) =>
        ["interview_scheduled", "technical_interview", "final_interview"].includes(a.status)
      ).length;
    default:
      return null;
  }
}

export function GoalsPanel({ applications }: Props) {
  const [goals,       setGoals]       = useState<UserGoal[]>([]);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [newTitle,    setNewTitle]    = useState("");
  const [newType,     setNewType]     = useState<GoalType>("custom");
  const [newTarget,   setNewTarget]   = useState("10");
  const [newDeadline, setNewDeadline] = useState("");
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const g = await getUserGoals(user.id);
    setGoals(g);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!userId || !newTitle.trim()) return;
    setSaving(true);
    const goal = await createGoal(userId, {
      title:        newTitle.trim(),
      goal_type:    newType,
      target_value: parseInt(newTarget) || 1,
      deadline:     newDeadline || null,
    });
    if (goal) {
      setGoals((g) => [goal, ...g]);
      toast.success("Goal created! 🎯");
      // check first_goal achievement
      const earned = await getEarnedAchievements(userId);
      const earnedSet = new Set(earned.map((e) => e.achievement_id));
      if (!earnedSet.has("first_goal")) {
        await checkAndAwardAchievements(userId, {
          appCount: applications.length,
          interviewCount: 0,
          streak: 0,
          goalCreatedCount: goals.length + 1,
          goalCompletedCount: 0,
          lessonCount: 0,
          qaCount: 0,
        });
        toast.success("🎯 Badge earned: Goal Setter (+30 XP)");
      }
    }
    setNewTitle(""); setNewType("custom"); setNewTarget("10"); setNewDeadline("");
    setSaving(false);
    setDialogOpen(false);
  }

  async function handleIncrement(goalId: string) {
    await incrementGoal(goalId);
    await load();
  }
  async function handleDecrement(goalId: string) {
    await decrementGoal(goalId);
    await load();
  }
  async function handleArchive(goalId: string) {
    await archiveGoal(goalId);
    setGoals((g) => g.filter((x) => x.id !== goalId));
    toast.success("Goal removed");
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
            <Target className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold">My Goals</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Goal title</Label>
                <Input
                  placeholder="e.g. Apply to 20 jobs this month"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Goal type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as GoalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(GOAL_TYPE_LABELS) as [GoalType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Target number</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline (optional)</Label>
                  <Input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                  />
                </div>
              </div>
              {newType !== "custom" && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  ℹ️ This goal will track automatically based on your application data.
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving || !newTitle.trim()}>
                  {saving ? "Saving…" : "Create Goal"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No goals yet</p>
          <p className="text-xs text-muted-foreground/70">Set a goal to stay motivated!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {goals.map((goal) => {
              const isAuto      = goal.goal_type !== "custom";
              const displayVal  = isAuto ? (computeAutoValue(goal.goal_type, applications) ?? goal.current_value) : goal.current_value;
              const percent     = Math.min(100, Math.round((displayVal / goal.target_value) * 100));
              const isCompleted = displayVal >= goal.target_value;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "rounded-lg border p-3",
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-background/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                      <p className={cn("text-sm font-medium truncate", isCompleted && "line-through text-muted-foreground")}>
                        {goal.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isAuto && (
                        <>
                          <button
                            onClick={() => handleDecrement(goal.id)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                            disabled={displayVal <= 0}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleIncrement(goal.id)}
                            className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleArchive(goal.id)}
                        className="flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{GOAL_TYPE_LABELS[goal.goal_type]}</span>
                      <span>{displayVal}/{goal.target_value} ({percent}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          isCompleted ? "bg-emerald-500" : "bg-primary"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
