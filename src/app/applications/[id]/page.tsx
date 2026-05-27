import { createClient } from "@/lib/supabase/server";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select(`*, activities(*), notes(*), files:application_files(*), reminders(*)`)
    .eq("id", id)
    .single();

  if (!application) notFound();
  return <ApplicationDetail application={application} />;
}
