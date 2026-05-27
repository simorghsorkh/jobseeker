"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Archive,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { MatchScore } from "./MatchScore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { updateApplication, deleteApplication } from "@/lib/db/applications";
import { useAppStore } from "@/store/useAppStore";
import type { Application } from "@/lib/types";
import toast from "react-hot-toast";

type SortKey = "company_name" | "job_title" | "status" | "application_date" | "updated_at";
type SortDir = "asc" | "desc";

interface TableViewProps {
  applications: Application[];
}

export function TableView({ applications }: TableViewProps) {
  const { updateApplication: updateInStore, removeApplication } = useAppStore();
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...applications].sort((a, b) => {
    const av = a[sortKey] ?? "";
    const bv = b[sortKey] ?? "";
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleBookmark = async (app: Application) => {
    const next = !app.is_bookmarked;
    updateInStore(app.id, { is_bookmarked: next });
    await updateApplication(app.id, { is_bookmarked: next });
  };

  const handleArchive = async (id: string) => {
    await updateApplication(id, { is_archived: true });
    removeApplication(id);
    toast.success("Archived");
  };

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
    removeApplication(id);
    toast.success("Deleted");
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3 opacity-30" />
    );

  const cols: { key: SortKey; label: string }[] = [
    { key: "company_name", label: "Company" },
    { key: "job_title", label: "Position" },
    { key: "status", label: "Status" },
    { key: "application_date", label: "Applied" },
    { key: "updated_at", label: "Updated" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  {col.label}
                  <SortIcon k={col.key} />
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
              Match
            </th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((app) => (
            <tr
              key={app.id}
              className="group hover:bg-accent/30 transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[140px]">{app.company_name}</p>
                    {app.industry && (
                      <p className="text-xs text-muted-foreground truncate">{app.industry}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/applications/${app.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors truncate block max-w-[200px]"
                >
                  {app.job_title}
                </Link>
                {app.job_url && (
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    View posting
                  </a>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {formatDate(app.application_date)}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {formatDate(app.updated_at)}
              </td>
              <td className="px-4 py-3">
                {app.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{app.location}</span>
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <MatchScore score={app.ai_match_score ?? app.match_score} size="sm" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleBookmark(app)}
                    className="p-1 rounded hover:bg-accent transition-colors"
                  >
                    {app.is_bookmarked ? (
                      <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleArchive(app.id)}>
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(app.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                No applications found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
