"use client";

import { useEffect, useMemo } from "react";
import {
  Briefcase,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PipelineChart } from "@/components/dashboard/PipelineChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { getApplications } from "@/lib/db/applications";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { subDays, isAfter } from "date-fns";
import type { ApplicationStatus } from "@/lib/types";

export default function DashboardPage() {
  const { applications, setApplications, setIsQuickAddOpen } = useAppStore();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const apps = await getApplications(user.id);
      setApplications(apps);
    };
    load();
  }, [setApplications]);

  const stats = useMemo(() => {
    const total = applications.length;
    const weekAgo = subDays(new Date(), 7);
    const thisWeek = applications.filter((a) => isAfter(new Date(a.created_at), weekAgo)).length;

    const statuses: Record<ApplicationStatus, number> = {
      saved: 0, preparing: 0, applied: 0, hr_review: 0,
      interview_scheduled: 0, technical_interview: 0, final_interview: 0,
      offer: 0, rejected: 0, accepted: 0, ghosted: 0,
    };
    applications.forEach((a) => { statuses[a.status] = (statuses[a.status] || 0) + 1; });

    const applied = statuses.applied + statuses.hr_review + statuses.interview_scheduled +
      statuses.technical_interview + statuses.final_interview + statuses.offer +
      statuses.rejected + statuses.accepted;
    const interviews = statuses.interview_scheduled + statuses.technical_interview +
      statuses.final_interview;
    const offers = statuses.offer + statuses.accepted;

    return {
      total,
      thisWeek,
      applied,
      responseRate: applied > 0 ? Math.round((interviews / applied) * 100) : 0,
      offerRate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
      interviews,
      offers,
      statuses,
    };
  }, [applications]);

  const upcomingInterviews = applications
    .filter((a) =>
      a.status === "interview_scheduled" ||
      a.status === "technical_interview" ||
      a.status === "final_interview"
    )
    .slice(0, 5);

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome + CTA */}
        {applications.length === 0 && (
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
            <div className="flex h-12 w-12 mx-auto mb-4 items-center justify-center rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Track your first application</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first job application to get started with JobFlow AI.
            </p>
            <Button onClick={() => setIsQuickAddOpen(true)}>
              Add First Application
            </Button>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Applications"
            value={stats.total}
            icon={<Briefcase className="h-5 w-5" />}
            color="blue"
            description={`${stats.thisWeek} added this week`}
          />
          <StatsCard
            label="Active Applications"
            value={stats.applied}
            icon={<TrendingUp className="h-5 w-5" />}
            color="violet"
            description="In pipeline"
          />
          <StatsCard
            label="Response Rate"
            value={`${stats.responseRate}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="green"
            description={`${stats.interviews} interview${stats.interviews !== 1 ? "s" : ""}`}
          />
          <StatsCard
            label="Offers"
            value={stats.offers}
            icon={<Calendar className="h-5 w-5" />}
            color="amber"
            description={stats.offerRate > 0 ? `${stats.offerRate}% offer rate` : "Keep going!"}
          />
        </div>

        {/* Charts & activity row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline chart */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Application Pipeline</h3>
              <Link
                href="/applications"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <PipelineChart applications={applications} />
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Activity</h3>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <ActivityFeed applications={applications} />
          </div>
        </div>

        {/* Weekly chart & upcoming interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly activity */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Weekly Activity</h3>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <WeeklyChart applications={applications} />
          </div>

          {/* Upcoming interviews */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Active Interviews</h3>
              <span className="text-xs font-semibold text-amber-500">
                {upcomingInterviews.length}
              </span>
            </div>
            {upcomingInterviews.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No active interviews</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingInterviews.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.job_title}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.company_name}</p>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        {stats.total > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Status Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.entries(stats.statuses) as [ApplicationStatus, number][])
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <Link
                    key={status}
                    href={`/applications?status=${status}`}
                    className="flex flex-col items-center rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors text-center"
                  >
                    <span className="text-2xl font-bold mb-1">{count}</span>
                    <StatusBadge status={status} size="sm" />
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
