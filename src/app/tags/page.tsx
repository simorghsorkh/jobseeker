"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TAG_COLORS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface TagItem {
  id: string;
  name: string;
  color: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("tags").select("*").eq("user_id", user.id);
      setTags(data || []);
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: newName, color: selectedColor })
      .select()
      .single();
    if (error) { toast.error("Failed to create tag"); return; }
    setTags((prev) => [...prev, data]);
    setNewName("");
    setIsAdding(false);
    toast.success("Tag created");
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("tags").delete().eq("id", id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tag deleted");
  };

  return (
    <AppLayout title="Tags">
      <div className="p-6 max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Tags</h1>
          <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Tag
          </Button>
        </div>

        {isAdding && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-scale-in">
            <Input
              placeholder="Tag name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-6 w-6 rounded-full transition-transform ${selectedColor === color ? "scale-125 ring-2 ring-offset-2 ring-border" : "hover:scale-110"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {tags.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No tags yet. Create one to organize your applications.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDelete(tag.id)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
