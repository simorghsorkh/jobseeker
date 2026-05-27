"use client";

import { useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { TableView } from "@/components/applications/TableView";
import { FilterBar } from "@/components/applications/FilterBar";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getApplications } from "@/lib/db/applications";
import { createClient } from "@/lib/supabase/client";
import { downloadCSV, formatDate } from "@/lib/utils";
import { STATUS_CONFIG } from "@/lib/constants";

export default function ApplicationsPage() {
  const {
    applications,
    setApplications,
    filters,
    viewMode,
    setIsQuickAddOpen,
  } = useAppStore();

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

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (app.is_archived) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !app.company_name.toLowerCase().includes(q) &&
          !app.job_title.toLowerCase().includes(q) &&
          !(app.location || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (filters.status.length && !filters.status.includes(app.status)) return false;
      if (filters.workMode.length && app.work_mode && !filters.workMode.includes(app.work_mode)) return false;
      if (filters.isBookmarked && !app.is_bookmarked) return false;
      return true;
    });
  }, [applications, filters]);

  const handleExport = () => {
    const rows = filtered.map((a) => ({
      "Company": a.company_name,
      "Job Title": a.job_title,
      "Status": STATUS_CONFIG[a.status].label,
      "Applied": formatDate(a.application_date),
      "Location": a.location || "",
      "Work Mode": a.work_mode || "",
      "Source": a.source || "",
      "Match Score": a.ai_match_score ?? a.match_score ?? "",
      "Job URL": a.job_url || "",
    }));
    downloadCSV(rows, `jobflow-applications-${new Date().toISOString().split("T")[0]}`);
  };

  return (
    <AppLayout title="Applications">
      <div className="p-6 space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Applications</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} application{filtered.length !== 1 ? "s" : ""}
              {applications.length !== filtered.length && ` (filtered from ${applications.length})`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setIsQuickAddOpen(true)} className="h-8 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Job
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar />

        {/* Views */}
        {viewMode === "kanban" ? (
          <KanbanBoard applications={filtered} />
        ) : (
          <TableView applications={filtered} />
        )}
      </div>
    </AppLayout>
  );
}
