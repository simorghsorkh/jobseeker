import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    // Not an admin — bounce to dashboard silently
    redirect("/dashboard");
  }

  return <AppLayout title="Admin">{children}</AppLayout>;
}
