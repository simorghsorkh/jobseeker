"use client";

import { useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAppStore } from "@/store/useAppStore";
import { getApplications } from "@/lib/db/applications";
import { createClient } from "@/lib/supabase/client";
import { STATUS_CONFIG, KANBAN_STATUSES } from "@/lib/constants";
import { subDays, format, startOfWeek, eachWeekOfInterval } from "date-fns";
import type { ApplicationStatus } from "@/lib/types";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

export default function AnalyticsPage() {
  const { applications, setApplications } = useAppStore();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const apps = await getApplications(user.id, { isArchived: false });
      setApplications(apps);
    };
    load();
  }, [setApplications]);

  const stats = useMemo(() => {
    const total = applications.length;

    // Status breakdown
    const byStatus = KANBAN_STATUSES.map((s) => ({
      name: STATUS_CONFIG[s].label,
      value: applications.filter((a) => a.status === s).length,
      color: STATUS_CONFIG[s].color,
    })).filter((s) => s.value > 0);

    // Source breakdown
    const sourceMap: Record<string, number> = {};
    applications.forEach((a) => {
      const s = a.source || "unknown";
      sourceMap[s] = (sourceMap[s] || 0) + 1;
    });
    const bySource = Object.entries(sourceMap).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Industry breakdown
    const industryMap: Record<string, number> = {};
    applications.forEach((a) => {
      if (a.industry) industryMap[a.industry] = (industryMap[a.industry] || 0) + 1;
    });
    const byIndustry = Object.entries(industryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Weekly trend (last 8 weeks)
    const now = new Date();
    const eightWeeksAgo = subDays(now, 56);
    const weeks = eachWeekOfInterval({ start: eightWeeksAgo, end: now });
    const weeklyTrend = weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const count = applications.filter((a) => {
        const d = new Date(a.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      return { week: format(weekStart, "MMM d"), count };
    });

    // Funnel
    const applied = applications.filter((a) =>
      !["saved", "preparing"].includes(a.status)
    ).length;
    const responded = applications.filter((a) =>
      ["hr_review", "interview_scheduled", "technical_interview", "final_interview", "offer", "accepted"].includes(a.status)
    ).length;
    const interviewed = applications.filter((a) =>
      ["interview_scheduled", "technical_interview", "final_interview", "offer", "accepted"].includes(a.status)
    ).length;
    const offered = applications.filter((a) => ["offer", "accepted"].includes(a.status)).length;

    const funnel = [
      { stage: "Applied", count: applied, pct: applied ? 100 : 0 },
      { stage: "Responded", count: responded, pct: applied ? Math.round((responded / applied) * 100) : 0 },
      { stage: "Interviewed", count: interviewed, pct: applied ? Math.round((interviewed / applied) * 100) : 0 },
      { stage: "Offered", count: offered, pct: applied ? Math.round((offered / applied) * 100) : 0 },
    ];

    return { total, byStatus, bySource, byIndustry, weeklyTrend, funnel };
  }, [applications]);

  return (
    <AppLayout title="Analytics">
      <div className="p-6 space-y-6">
        <h1 className="text-xl font-bold tracking-tight">Analytics</h1>

        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Applications", value: stats.total },
            { label: "Response Rate", value: `${stats.funnel[1]?.pct ?? 0}%` },
            { label: "Interview Rate", value: `${stats.funnel[2]?.pct ?? 0}%` },
            { label: "Offer Rate", value: `${stats.funnel[3]?.pct ?? 0}%` },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</p>
              <p className="text-3xl font-bold mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status breakdown */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={stats.byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {stats.byStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {stats.byStatus.slice(0, 6).map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="flex-1 text-muted-foreground truncate">{s.name}</span>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly trend */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Weekly Applications</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={stats.weeklyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Application Funnel</h3>
          <div className="grid grid-cols-4 gap-4">
            {stats.funnel.map((stage, i) => (
              <div key={stage.stage} className="text-center">
                <div
                  className="mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2 transition-all"
                  style={{ height: `${Math.max(40, (stage.pct / 100) * 160)}px` }}
                >
                  <span className="text-2xl font-bold text-primary">{stage.count}</span>
                </div>
                <p className="text-xs font-medium">{stage.stage}</p>
                <p className="text-xs text-muted-foreground">{stage.pct}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Industry & Source charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By industry */}
          {stats.byIndustry.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4">By Industry</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.byIndustry} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By source */}
          {stats.bySource.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4">Application Sources</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.bySource} margin={{ top: 5, right: 5, bottom: 20, left: -25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.bySource.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
