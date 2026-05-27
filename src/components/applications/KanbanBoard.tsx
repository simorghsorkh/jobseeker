"use client";

import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { KanbanCard } from "./KanbanCard";
import { StatusBadge } from "./StatusBadge";
import { STATUS_CONFIG, KANBAN_STATUSES } from "@/lib/constants";
import { updateApplicationStatus } from "@/lib/db/applications";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationStatus } from "@/lib/types";
import toast from "react-hot-toast";

interface KanbanBoardProps {
  applications: Application[];
}

export function KanbanBoard({ applications }: KanbanBoardProps) {
  const { updateApplication, setIsQuickAddOpen } = useAppStore();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as ApplicationStatus;

    const app = applications.find((a) => a.id === draggableId);
    if (!app || app.status === newStatus) return;

    // Optimistic update
    updateApplication(draggableId, { status: newStatus, updated_at: new Date().toISOString() });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await updateApplicationStatus(draggableId, newStatus, user.id);
    } catch {
      // Revert
      updateApplication(draggableId, { status: app.status });
      toast.error("Failed to update status");
    }
  };

  const grouped = KANBAN_STATUSES.reduce<Record<string, Application[]>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s);
    return acc;
  }, {});

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-board">
        {KANBAN_STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          const cards = grouped[status] || [];

          return (
            <div key={status} className="kanban-column">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} size="sm" />
                  <span
                    className="text-xs font-semibold text-muted-foreground"
                    style={{ color: config.color }}
                  >
                    {cards.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2 rounded-xl min-h-[100px] p-2 transition-colors ${
                      snapshot.isDraggingOver
                        ? "bg-primary/5 ring-1 ring-primary/20"
                        : "bg-muted/30"
                    }`}
                  >
                    {cards.map((app, index) => (
                      <KanbanCard key={app.id} application={app} index={index} />
                    ))}
                    {provided.placeholder}
                    {cards.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex h-16 items-center justify-center">
                        <p className="text-xs text-muted-foreground/50">Drop here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
