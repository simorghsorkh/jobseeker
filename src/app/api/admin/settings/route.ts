import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return true; // no restriction configured → any authed user
  return email === adminEmail;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data, error } = await supabase
      .from("admin_settings")
      .select("key, value, updated_at");
    if (error) throw error;
    const map: Record<string, string> = {};
    (data || []).forEach((row) => { map[row.key] = row.value; });
    return NextResponse.json(map);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { key, value } = await request.json();
    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
