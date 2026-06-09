import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const alertId  = searchParams.get("alertId");
    const filter   = searchParams.get("filter") || "new"; // new | saved | all
    const page     = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    let query = supabase
      .from("scraped_jobs")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_dismissed", false)
      .order("first_seen_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (alertId) query = query.eq("alert_id", alertId);
    if (filter === "new")   query = query.eq("is_new", true);
    if (filter === "saved") query = query.eq("is_saved", true);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, action } = await request.json(); // action: 'save' | 'dismiss' | 'unsave'

    const updates: Record<string, boolean> = {};
    if (action === "save")    { updates.is_saved = true;  updates.is_new = false; }
    if (action === "unsave")  { updates.is_saved = false; }
    if (action === "dismiss") { updates.is_dismissed = true; updates.is_new = false; }

    await supabase.from("scraped_jobs").update(updates).eq("id", id).eq("user_id", user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
