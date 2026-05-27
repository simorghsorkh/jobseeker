"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  ExternalLink,
  Calendar,
  Trash2,
  Archive,
} from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MatchScore } from "./MatchScore";
import { formatDate, cn } from "@/lib/utils";
import { updateApplication, deleteApplication } from "@/lib/db/applications";
import { useAppStore } from "@/store/useAppStore";
import type { Application } from "@/lib/types";
import { WORK_MODES } from "@/lib/constants";
import toast from "react-hot-toast";

interface KanbanCardProps {
  application: Application;
  index: number;
}

export function KanbanCard({ application: app, index }: KanbanCardProps) {
  const { updateApplication: updateInStore, removeApplication } = useAppStore();
  const [isBookmarked, setIsBookmarked] = useState(app.is_bookmarked);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isBookmarked;
    setIsBookmarked(next);
    await updateApplication(app.id, { is_bookmarked: next });
    updateInStore(app.id, { is_bookmarked: next });
  };

  const handleArchive = async () => {
    await updateApplication(app.id, { is_archived: true });
    removeApplication(app.id);
    toast.success("Application archived");
  };

  const handleDelete = async () => {
    await deleteApplication(app.id);
    removeApplication(app.id);
    toast.success("Application deleted");
  };

  const workModeLabel = WORK_MODES.find((m) => m.value === app.work_mode)?.label;

  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group rounded-lg border border-border bg-card p-3.5 cursor-pointer hover:shadow-md transition-all duration-150",
            snapshot.isDragging && "shadow-xl ring-2 ring-primary/30 rotate-1"
          )}
        >
          <Link href={`/applications/${app.id}`} className="block">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                  {app.job_title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {app.company_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={toggleBookmark}
                  className="p-1 rounded hover:bg-accent transition-colors"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {app.job_url && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(app.job_url!, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Open Job URL
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleArchive(); }}>
                      <Archive className="h-3.5 w-3.5 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.preventDefault(); handleDelete(); }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {app.location && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5" />
                  {app.location}
                </span>
              )}
              {workModeLabel && (
                <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {workModeLabel}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-2.5 w-2.5" />
                {formatDate(app.application_date || app.created_at)}
              </div>
              {(app.match_score !== null || app.ai_match_score !== null) && (
                <MatchScore score={app.ai_match_score ?? app.match_score} size="sm" />
              )}
            </div>
          </Link>
        </div>
      )}
    </Draggable>
  );
}
