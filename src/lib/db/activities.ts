import { createClient } from "@/lib/supabase/client";
import type { Activity, Note, Reminder, ApplicationFile } from "@/lib/types";

export async function getActivities(applicationId: string): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createNote(
  note: Omit<Note, "id" | "created_at" | "updated_at">
): Promise<Note> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert(note)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("activities").insert({
    application_id: note.application_id,
    user_id: note.user_id,
    type: "note_added",
    title: note.title || "Note added",
    description: note.content.slice(0, 100),
  });

  return data;
}

export async function updateNote(
  id: string,
  updates: Partial<Note>
): Promise<Note> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export async function createReminder(
  reminder: Omit<Reminder, "id" | "created_at">
): Promise<Reminder> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .insert(reminder)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReminder(
  id: string,
  updates: Partial<Reminder>
): Promise<Reminder> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUpcomingReminders(userId: string): Promise<Reminder[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("reminders")
    .select("*, applications(company_name, job_title)")
    .eq("user_id", userId)
    .eq("is_completed", false)
    .gte("due_date", new Date().toISOString())
    .order("due_date", { ascending: true })
    .limit(10);
  return data || [];
}

export async function uploadFile(
  file: File,
  applicationId: string,
  userId: string,
  category: ApplicationFile["category"]
): Promise<ApplicationFile> {
  const supabase = createClient();
  const path = `${userId}/${applicationId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("application-files")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("application-files")
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("application_files")
    .insert({
      application_id: applicationId,
      user_id: userId,
      name: file.name,
      file_path: path,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      category,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("activities").insert({
    application_id: applicationId,
    user_id: userId,
    type: "file_uploaded",
    title: `File uploaded: ${file.name}`,
    metadata: { category, file_name: file.name },
  });

  return data;
}

export async function deleteFile(
  fileId: string,
  filePath: string
): Promise<void> {
  const supabase = createClient();

  await supabase.storage.from("application-files").remove([filePath]);
  const { error } = await supabase
    .from("application_files")
    .delete()
    .eq("id", fileId);
  if (error) throw error;
}
