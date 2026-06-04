import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load current settings (may be empty before migration runs)
  const { data: rows } = await supabase
    .from("admin_settings")
    .select("key, value");

  const settings: Record<string, string> = {};
  (rows || []).forEach((r) => { settings[r.key] = r.value; });

  // Application count for this user
  const { count: appCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  return (
    <AdminDashboard
      currentModel={settings.ai_model || "anthropic/claude-3.5-sonnet"}
      aiEnabled={settings.ai_enabled !== "false"}
      appCount={appCount || 0}
    />
  );
}
