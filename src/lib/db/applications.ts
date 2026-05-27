import { createClient } from "@/lib/supabase/client";
import type { Application, ApplicationStatus, FilterState } from "@/lib/types";

export async function getApplications(
  userId: string,
  filters?: Partial<FilterState>
): Promise<Application[]> {
  const supabase = createClient();
  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (filters?.isArchived !== undefined) {
    query = query.eq("is_archived", filters.isArchived);
  } else {
    query = query.eq("is_archived", false);
  }

  if (filters?.status?.length) {
    query = query.in("status", filters.status);
  }

  if (filters?.industry?.length) {
    query = query.in("industry", filters.industry);
  }

  if (filters?.workMode?.length) {
    query = query.in("work_mode", filters.workMode);
  }

  if (filters?.seniority?.length) {
    query = query.in("seniority_level", filters.seniority);
  }

  if (filters?.source?.length) {
    query = query.in("source", filters.source);
  }

  if (filters?.isBookmarked) {
    query = query.eq("is_bookmarked", true);
  }

  if (filters?.dateFrom) {
    query = query.gte("application_date", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("application_date", filters.dateTo);
  }

  if (filters?.search) {
    query = query.or(
      `company_name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      activities(*),
      notes(*),
      files:application_files(*),
      reminders(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createApplication(
  app: Omit<Application, "id" | "created_at" | "updated_at">
): Promise<Application> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert(app)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplication(
  id: string,
  updates: Partial<Application>
): Promise<Application> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteApplication(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  userId: string
): Promise<Application> {
  const supabase = createClient();

  const { data: current } = await supabase
    .from("applications")
    .select("status")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Record status history
  await supabase.from("status_history").insert({
    application_id: id,
    user_id: userId,
    from_status: current?.status || null,
    to_status: status,
    changed_at: new Date().toISOString(),
  });

  // Record activity
  await supabase.from("activities").insert({
    application_id: id,
    user_id: userId,
    type: "status_change",
    title: `Status changed to ${status.replace(/_/g, " ")}`,
    description: current?.status
      ? `From "${current.status.replace(/_/g, " ")}" to "${status.replace(/_/g, " ")}"`
      : null,
    metadata: { from: current?.status, to: status },
  });

  return data;
}

export async function duplicateDetection(
  userId: string,
  companyName: string,
  jobTitle: string
): Promise<Application[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .ilike("company_name", `%${companyName}%`)
    .ilike("job_title", `%${jobTitle}%`);
  return data || [];
}
