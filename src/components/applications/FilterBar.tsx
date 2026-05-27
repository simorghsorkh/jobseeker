"use client";

import { useState } from "react";
import {
  X,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { STATUS_CONFIG, KANBAN_STATUSES, WORK_MODES } from "@/lib/constants";
import type { ApplicationStatus, WorkMode } from "@/lib/types";

export function FilterBar() {
  const { filters, setFilters, resetFilters, viewMode, setViewMode } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount =
    filters.status.length +
    filters.workMode.length +
    filters.industry.length +
    (filters.isBookmarked ? 1 : 0);

  const toggleStatus = (s: ApplicationStatus) => {
    setFilters({
      status: filters.status.includes(s)
        ? filters.status.filter((x) => x !== s)
        : [...filters.status, s],
    });
  };

  const toggleWorkMode = (m: WorkMode) => {
    setFilters({
      workMode: filters.workMode.includes(m)
        ? filters.workMode.filter((x) => x !== m)
        : [...filters.workMode, m],
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Filter applications..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            icon={<Search className="h-3.5 w-3.5" />}
            className="h-8 text-xs"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={resetFilters}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-border p-0.5 bg-muted/50">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
              viewMode === "kanban"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-all ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4 animate-slide-down">
          {/* Status filter */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {KANBAN_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
                    filters.status.includes(s)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {filters.status.includes(s) && <X className="h-2.5 w-2.5" />}
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Work mode */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Work Mode</p>
            <div className="flex gap-2">
              {WORK_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => toggleWorkMode(m.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    filters.workMode.includes(m.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bookmarked */}
          <div>
            <button
              onClick={() => setFilters({ isBookmarked: filters.isBookmarked ? null : true })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                filters.isBookmarked
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              ★ Bookmarked only
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.status.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              {STATUS_CONFIG[s].label}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
          {filters.workMode.map((m) => (
            <button
              key={m}
              onClick={() => toggleWorkMode(m)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              {WORK_MODES.find((x) => x.value === m)?.label}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
