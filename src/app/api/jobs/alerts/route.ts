import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: alerts } = await supabase
      .from("job_alerts")
      .select("*, scraped_jobs(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Count new jobs per alert
    const alertsWithCounts = await Promise.all(
      (alerts || []).map(async (alert) => {
        const { count: newCount } = await supabase
          .from("scraped_jobs")
          .select("*", { count: "exact", head: true })
          .eq("alert_id", alert.id)
          .eq("is_new", true)
          .eq("is_dismissed", false);
        return { ...alert, new_count: newCount ?? 0 };
      })
    );

    return NextResponse.json(alertsWithCounts);
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabase
      .from("job_alerts")
      .insert({ ...body, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    await supabase.from("job_alerts").delete().eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
