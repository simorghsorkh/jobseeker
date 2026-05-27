"use client";

import { formatRelativeDate } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";
import type { Application } from "@/lib/types";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { Building2, Clock } from "lucide-react";
import Link from "next/link";

interface ActivityFeedProps {
  applications: Application[];
}

export function ActivityFeed({ applications }: ActivityFeedProps) {
  const recent = [...applications]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((app) => (
        <Link
          key={app.id}
          href={`/applications/${app.id}`}
          className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-accent/50 transition-colors group"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {app.job_title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{app.company_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={app.status} size="sm" />
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeDate(app.updated_at)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
