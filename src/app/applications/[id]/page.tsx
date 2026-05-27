import { createClient } from "@/lib/supabase/server";
import { getApplication } from "@/lib/db/applications";
import { ApplicationDetail } from "@/components/applications/ApplicationDetail";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationPage({ params }: PageProps) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();
  return <ApplicationDetail application={application} />;
}
