"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createNote, updateNote, deleteNote } from "@/lib/db/activities";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeDate } from "@/lib/utils";
import type { Note } from "@/lib/types";
import toast from "react-hot-toast";

interface ApplicationNotesProps {
  applicationId: string;
}

export function ApplicationNotes({ applicationId }: ApplicationNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notes")
      .select("*")
      .eq("application_id", applicationId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotes(data || []));
  }, [applicationId]);

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const note = await createNote({
        application_id: applicationId,
        user_id: user.id,
        title: newTitle || null,
        content: newContent,
        tags: [],
        is_pinned: false,
      });
      setNotes((prev) => [note, ...prev]);
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
      toast.success("Note added");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Note deleted");
  };

  const handlePin = async (note: Note) => {
    const updated = await updateNote(note.id, { is_pinned: !note.is_pinned });
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Add note */}
      {isAdding ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Input
            placeholder="Title (optional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="Write your note..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} isLoading={isSaving}>Save Note</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Note
        </Button>
      )}

      {/* Notes list */}
      {notes.length === 0 && !isAdding && (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No notes yet</p>
        </div>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className={`rounded-xl border bg-card p-4 ${note.is_pinned ? "border-primary/30 bg-primary/5" : "border-border"}`}
        >
          {note.title && (
            <h4 className="text-sm font-semibold mb-2">{note.title}</h4>
          )}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {note.content}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeDate(note.created_at)}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePin(note)}
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                {note.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
