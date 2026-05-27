"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowRight, FileUp, StickyNote, Bell, Sparkles, Mail, Briefcase } from "lucide-react";
import { getActivities } from "@/lib/db/activities";
import { formatRelativeDate, formatDateTime } from "@/lib/utils";
import type { Activity, ActivityType } from "@/lib/types";

interface ApplicationTimelineProps {
  applicationId: string;
}

const activityConfig: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  status_change: { icon: ArrowRight, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
  note_added: { icon: StickyNote, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
  file_uploaded: { icon: FileUp, color: "text-violet-500 bg-violet-50 dark:bg-violet-950/30" },
  reminder_set: { icon: Bell, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
  ai_generated: { icon: Sparkles, color: "text-violet-500 bg-violet-50 dark:bg-violet-950/30" },
  email_sent: { icon: Mail, color: "text-sky-500 bg-sky-50 dark:bg-sky-950/30" },
  interview_scheduled: { icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
  offer_received: { icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
  application_created: { icon: Briefcase, color: "text-primary bg-primary/10" },
};

export function ApplicationTimeline({ applicationId }: ApplicationTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getActivities(applicationId)
      .then(setActivities)
      .finally(() => setIsLoading(false));
  }, [applicationId]);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1 pt-1">
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-2.5 bg-muted rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="mt-4 flex flex-col items-center py-12 text-center">
        <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Actions like status changes and notes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 relative">
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />
      <div className="space-y-4">
        {activities.map((activity, i) => {
          const config = activityConfig[activity.type] || activityConfig.application_created;
          const Icon = config.icon;
          return (
            <div key={activity.id} className="flex gap-3 relative">
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border ${config.color.split(" ").slice(1).join(" ")} z-10`}>
                <Icon className={`h-3.5 w-3.5 ${config.color.split(" ")[0]}`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatRelativeDate(activity.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
