"use client";

import { useEffect, useMemo } from "react";
import { Archive } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TableView } from "@/components/applications/TableView";
import { useAppStore } from "@/store/useAppStore";
import { getApplications } from "@/lib/db/applications";
import { createClient } from "@/lib/supabase/client";

export default function ArchivePage() {
  const { applications, setApplications } = useAppStore();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const apps = await getApplications(user.id, { isArchived: true });
      setApplications(apps);
    };
    load();
  }, [setApplications]);

  const archived = useMemo(() => applications.filter((a) => a.is_archived), [applications]);

  return (
    <AppLayout title="Archive">
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Archive</h1>
          <p className="text-sm text-muted-foreground">
            {archived.length} archived application{archived.length !== 1 ? "s" : ""}
          </p>
        </div>
        {archived.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <Archive className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold mb-1">Archive is empty</h3>
            <p className="text-sm text-muted-foreground">Archived applications appear here.</p>
          </div>
        ) : (
          <TableView applications={archived} />
        )}
      </div>
    </AppLayout>
  );
}
