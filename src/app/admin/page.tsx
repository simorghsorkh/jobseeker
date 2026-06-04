import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Load settings (may not exist yet before migration runs)
  const { data: settingsRows } = await supabase
    .from("admin_settings")
    .select("key, value");

  const settings: Record<string, string> = {};
  (settingsRows || []).forEach((r) => { settings[r.key] = r.value; });

  // Application count for the current user
  const { count: appCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <AdminDashboard
      currentModel={settings.ai_model || "anthropic/claude-3.5-sonnet"}
      aiEnabled={settings.ai_enabled !== "false"}
      appCount={appCount || 0}
    />
  );
}
