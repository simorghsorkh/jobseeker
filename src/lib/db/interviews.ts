import { createClient } from "@/lib/supabase/client";
import type { InterviewRound, InterviewQuestion, InterviewResult, QuestionCategory } from "@/lib/types";

// ─── Interview Rounds ────────────────────────────────────────────────────────

export async function getInterviewRounds(applicationId: string): Promise<InterviewRound[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_rounds")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createInterviewRound(
  round: Omit<InterviewRound, "id" | "created_at">
): Promise<InterviewRound> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_rounds")
    .insert(round)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInterviewRound(
  id: string,
  updates: { round_name?: string; result?: InterviewResult | null; interview_date?: string | null; notes?: string | null }
): Promise<InterviewRound> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_rounds")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInterviewRound(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("interview_rounds").delete().eq("id", id);
  if (error) throw error;
}

// ─── Interview Questions ─────────────────────────────────────────────────────

export async function getInterviewQuestions(applicationId: string): Promise<InterviewQuestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_questions")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createInterviewQuestion(
  q: Omit<InterviewQuestion, "id" | "created_at" | "updated_at">
): Promise<InterviewQuestion> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_questions")
    .insert(q)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInterviewQuestion(
  id: string,
  updates: { question?: string; answer?: string | null; category?: QuestionCategory }
): Promise<InterviewQuestion> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interview_questions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInterviewQuestion(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("interview_questions").delete().eq("id", id);
  if (error) throw error;
}
