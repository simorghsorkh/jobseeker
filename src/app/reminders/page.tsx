"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Calendar, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { Button } from "@/components/ui/button";
import { getUpcomingReminders, updateReminder } from "@/lib/db/activities";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, cn } from "@/lib/utils";
import type { Reminder } from "@/lib/types";
import { isAfter } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<(Reminder & { applications?: { company_name: string; job_title: string } })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("reminders")
        .select("*, applications(company_name, job_title, status)")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      setReminders(data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  const toggleComplete = async (reminder: Reminder) => {
    const updated = await updateReminder(reminder.id, { is_completed: !reminder.is_completed });
    setReminders((prev) => prev.map((r) => (r.id === reminder.id ? { ...r, ...updated } : r)));
    toast.success(updated.is_completed ? "Marked as done" : "Reopened");
  };

  const pending = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);
  const isOverdue = (r: Reminder) => !r.is_completed && !isAfter(new Date(r.due_date), new Date());

  const ReminderItem = ({ reminder }: { reminder: typeof reminders[0] }) => {
    const overdue = isOverdue(reminder);
    return (
      <div className={cn(
        "flex items-center gap-4 rounded-xl border p-4",
        reminder.is_completed ? "border-border bg-muted/30 opacity-60" : overdue ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
      )}>
        <button
          onClick={() => toggleComplete(reminder)}
          className={cn(
            "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
            reminder.is_completed ? "border-primary bg-primary text-white" : "border-border hover:border-primary"
          )}
        >
          {reminder.is_completed && <Check className="h-3.5 w-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm", reminder.is_completed && "line-through text-muted-foreground")}>
            {reminder.title}
          </p>
          {reminder.applications && (
            <Link href={`/applications/${reminder.application_id}`} className="text-xs text-primary hover:underline">
              {reminder.applications.company_name} · {reminder.applications.job_title}
            </Link>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className={cn("h-3 w-3", overdue ? "text-destructive" : "text-muted-foreground")} />
            <span className={cn("text-xs", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              {overdue && "OVERDUE · "}
              {formatDateTime(reminder.due_date)}
            </span>
          </div>
        </div>

        <span className="text-xs font-medium text-muted-foreground capitalize bg-muted px-2 py-1 rounded-md">
          {reminder.type.replace(/_/g, " ")}
        </span>
      </div>
    );
  };

  return (
    <AppLayout title="Reminders">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Reminders</h1>
            <p className="text-sm text-muted-foreground">
              {pending.length} pending reminder{pending.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl border border-border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <Bell className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold mb-1">No reminders yet</h3>
            <p className="text-sm text-muted-foreground">
              Add reminders from any application to track follow-ups and deadlines.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending */}
            {pending.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Pending ({pending.length})
                </h2>
                {pending.map((r) => <ReminderItem key={r.id} reminder={r} />)}
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Completed ({completed.length})
                </h2>
                {completed.map((r) => <ReminderItem key={r.id} reminder={r} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
