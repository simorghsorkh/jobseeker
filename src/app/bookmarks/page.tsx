"use client";

import { useEffect, useMemo } from "react";
import { BookmarkCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TableView } from "@/components/applications/TableView";
import { useAppStore } from "@/store/useAppStore";
import { getApplications } from "@/lib/db/applications";
import { createClient } from "@/lib/supabase/client";

export default function BookmarksPage() {
  const { applications, setApplications } = useAppStore();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const apps = await getApplications(user.id, { isBookmarked: true });
      setApplications(apps);
    };
    load();
  }, [setApplications]);

  const bookmarked = useMemo(() => applications.filter((a) => a.is_bookmarked), [applications]);

  return (
    <AppLayout title="Bookmarks">
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">
            {bookmarked.length} bookmarked application{bookmarked.length !== 1 ? "s" : ""}
          </p>
        </div>

        {bookmarked.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <BookmarkCheck className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold mb-1">No bookmarks yet</h3>
            <p className="text-sm text-muted-foreground">
              Bookmark jobs you&apos;re interested in to find them quickly.
            </p>
          </div>
        ) : (
          <TableView applications={bookmarked} />
        )}
      </div>
    </AppLayout>
  );
}
