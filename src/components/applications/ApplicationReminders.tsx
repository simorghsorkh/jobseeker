"use client";

import { useEffect, useState } from "react";
import { Plus, Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createReminder, updateReminder } from "@/lib/db/activities";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, cn } from "@/lib/utils";
import type { Reminder, ReminderType } from "@/lib/types";
import toast from "react-hot-toast";
import { isAfter } from "date-fns";

const REMINDER_TYPES: { value: ReminderType; label: string }[] = [
  { value: "follow_up", label: "Follow-up" },
  { value: "interview", label: "Interview" },
  { value: "deadline", label: "Deadline" },
  { value: "recruiter_reply", label: "Recruiter Reply" },
  { value: "other", label: "Other" },
];

interface ApplicationRemindersProps {
  applicationId: string;
}

export function ApplicationReminders({ applicationId }: ApplicationRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<ReminderType>("follow_up");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reminders")
      .select("*")
      .eq("application_id", applicationId)
      .order("due_date", { ascending: true })
      .then(({ data }) => setReminders(data || []));
  }, [applicationId]);

  const handleAdd = async () => {
    if (!title.trim() || !dueDate) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const reminder = await createReminder({
        application_id: applicationId,
        user_id: user.id,
        type,
        title,
        description: null,
        due_date: new Date(dueDate).toISOString(),
        is_completed: false,
      });
      setReminders((prev) => [...prev, reminder].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      setTitle("");
      setDueDate("");
      setIsAdding(false);
      toast.success("Reminder set");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleComplete = async (reminder: Reminder) => {
    const updated = await updateReminder(reminder.id, { is_completed: !reminder.is_completed });
    setReminders((prev) => prev.map((r) => (r.id === reminder.id ? updated : r)));
  };

  const isOverdue = (r: Reminder) => !r.is_completed && !isAfter(new Date(r.due_date), new Date());

  return (
    <div className="mt-4 space-y-4">
      {isAdding ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              placeholder="e.g. Follow up with recruiter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} isLoading={isSaving}>Set Reminder</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setIsAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Reminder
        </Button>
      )}

      {reminders.length === 0 && !isAdding ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No reminders set</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                reminder.is_completed
                  ? "border-border bg-muted/30 opacity-60"
                  : isOverdue(reminder)
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-card"
              )}
            >
              <button
                onClick={() => toggleComplete(reminder)}
                className={cn(
                  "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  reminder.is_completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {reminder.is_completed && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", reminder.is_completed && "line-through")}>
                  {reminder.title}
                </p>
                <p className={cn("text-xs mt-0.5", isOverdue(reminder) ? "text-destructive" : "text-muted-foreground")}>
                  {isOverdue(reminder) ? "Overdue · " : ""}
                  {formatDateTime(reminder.due_date)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground capitalize">
                {REMINDER_TYPES.find((t) => t.value === reminder.type)?.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
