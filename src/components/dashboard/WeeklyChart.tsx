"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { subDays, format, startOfDay } from "date-fns";
import type { Application } from "@/lib/types";

interface WeeklyChartProps {
  applications: Application[];
}

export function WeeklyChart({ applications }: WeeklyChartProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const count = applications.filter((a) => {
      const d = startOfDay(new Date(a.created_at));
      return d.getTime() === date.getTime();
    }).length;
    return {
      day: format(date, "EEE"),
      count,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={days} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#activityGradient)"
          dot={{ fill: "hsl(var(--primary))", r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
