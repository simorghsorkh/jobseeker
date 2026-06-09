import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseRSS, stripHtml } from "@/lib/parsers/rss";

interface JobRow {
  user_id:      string;
  alert_id:     string;
  source:       string;
  title:        string;
  company:      string | null;
  location:     string | null;
  url:          string;
  description:  string | null;
  salary:       string | null;
  tags:         string[];
  posted_at:    string | null;
  is_new:       boolean;
}

// ── Remotive (free public API) ───────────────────────────────────────────────
async function fetchRemotive(keywords: string): Promise<Omit<JobRow, "user_id" | "alert_id" | "is_new">[]> {
  try {
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keywords)}&limit=50`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.jobs || []).map((j: any) => ({
      source:      "remotive",
      title:       j.title || "",
      company:     j.company_name || null,
      location:    j.candidate_required_location || "Remote",
      url:         j.url || "",
      description: stripHtml(j.description || "").slice(0, 800),
      salary:      j.salary || null,
      tags:        Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
      posted_at:   j.publication_date || null,
    })).filter((j: { url: string }) => j.url);
  } catch { return []; }
}

// ── RemoteOK (free public API) ───────────────────────────────────────────────
async function fetchRemoteOK(keywords: string): Promise<Omit<JobRow, "user_id" | "alert_id" | "is_new">[]> {
  try {
    const tag = keywords.toLowerCase().replace(/\s+/g, "-");
    const res = await fetch(
      `https://remoteok.com/api?tags=${encodeURIComponent(tag)}`,
      {
        headers: { "User-Agent": "JobFlow-AI/1.0" },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items = Array.isArray(json) ? json.slice(1) : []; // first item is legal notice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return items.map((j: any) => ({
      source:      "remoteok",
      title:       j.position || j.title || "",
      company:     j.company || null,
      location:    "Remote",
      url:         j.url || `https://remoteok.com/l/${j.slug}`,
      description: stripHtml(j.description || "").slice(0, 800),
      salary:      j.salary ? `${j.salary_min || ""}–${j.salary_max || ""}` : null,
      tags:        Array.isArray(j.tags) ? j.tags.slice(0, 6) : [],
      posted_at:   j.date || null,
    })).filter((j: { title: string; url: string }) => j.title && j.url);
  } catch { return []; }
}

// ── RSS feed (Indeed, custom, etc.) ─────────────────────────────────────────
async function fetchRSS(
  rssUrl: string,
  sourceName: string
): Promise<Omit<JobRow, "user_id" | "alert_id" | "is_new">[]> {
  try {
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "JobFlow-AI/1.0 (RSS Reader)" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const xml  = await res.text();
    const items = parseRSS(xml);

    return items.map((item) => {
      // Indeed titles are often "Job Title - Company"
      let title   = item.title;
      let company: string | null = null;
      if (sourceName === "indeed") {
        const parts = item.title.split(" - ");
        if (parts.length >= 2) {
          company = parts.pop()!.trim();
          title   = parts.join(" - ").trim();
        }
      }
      return {
        source:      sourceName,
        title,
        company,
        location:    null,
        url:         item.link,
        description: stripHtml(item.description).slice(0, 800),
        salary:      null,
        tags:        [],
        posted_at:   item.pubDate,
      };
    }).filter((j) => j.title && j.url);
  } catch { return []; }
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { alertId } = await request.json();

    // Load alert
    const { data: alert, error: alertErr } = await supabase
      .from("job_alerts")
      .select("*")
      .eq("id", alertId)
      .eq("user_id", user.id)
      .single();

    if (alertErr || !alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const sources: string[]  = alert.sources || [];
    const keywords: string   = alert.keywords || "";
    const allJobs: Omit<JobRow, "user_id" | "alert_id" | "is_new">[] = [];

    // Fetch from selected sources in parallel
    const fetches: Promise<Omit<JobRow, "user_id" | "alert_id" | "is_new">[]>[] = [];

    if (sources.includes("remotive")) fetches.push(fetchRemotive(keywords));
    if (sources.includes("remoteok")) fetches.push(fetchRemoteOK(keywords));
    if (sources.includes("indeed_rss") && alert.indeed_rss_url) {
      fetches.push(fetchRSS(alert.indeed_rss_url, "indeed"));
    }
    if (sources.includes("custom_rss")) {
      for (const url of (alert.custom_rss_urls || [])) {
        fetches.push(fetchRSS(url, "custom"));
      }
    }

    const results = await Promise.allSettled(fetches);
    for (const r of results) {
      if (r.status === "fulfilled") allJobs.push(...r.value);
    }

    if (allJobs.length === 0) {
      await supabase.from("job_alerts")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", alertId);
      return NextResponse.json({ newCount: 0, total: 0 });
    }

    // Upsert jobs — UNIQUE(user_id, url) prevents duplicates
    const rows: JobRow[] = allJobs.map((j) => ({
      ...j,
      user_id:  user.id,
      alert_id: alertId,
      is_new:   true,
    }));

    // Insert only genuinely new ones (ignore conflicts = existing jobs)
    const { data: inserted } = await supabase
      .from("scraped_jobs")
      .upsert(rows, { onConflict: "user_id,url", ignoreDuplicates: true })
      .select("id");

    const newCount = inserted?.length ?? 0;

    // Update last_checked_at
    await supabase.from("job_alerts")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", alertId);

    return NextResponse.json({ newCount, total: allJobs.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — mark all new jobs for an alert as seen
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { alertId } = await request.json();
    await supabase
      .from("scraped_jobs")
      .update({ is_new: false })
      .eq("user_id", user.id)
      .eq("alert_id", alertId)
      .eq("is_new", true);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
