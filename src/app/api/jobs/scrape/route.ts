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

type JobInput = Omit<JobRow, "user_id" | "alert_id" | "is_new">;

// ── Greenhouse public API (free, no key needed) ──────────────────────────────
async function fetchGreenhouse(slug: string, keywords: string): Promise<JobInput[]> {
  try {
    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const kw   = keywords.toLowerCase().split(/[\s,]+/).filter(Boolean);

    return (json.jobs || [])
      .filter((j: { title?: string }) =>
        !kw.length || kw.some((k) => j.title?.toLowerCase().includes(k))
      )
      .map((j: {
        title?: string; absolute_url?: string; location?: { name?: string };
        content?: string; updated_at?: string; departments?: { name: string }[];
      }) => ({
        source:      "greenhouse",
        title:       j.title || "",
        company:     json.meta?.name || slug,
        location:    j.location?.name || null,
        url:         j.absolute_url || "",
        description: j.content ? stripHtml(j.content).slice(0, 800) : null,
        salary:      null,
        tags:        (j.departments || []).map((d: { name: string }) => d.name),
        posted_at:   j.updated_at || null,
      }))
      .filter((j: JobInput) => j.title && j.url);
  } catch { return []; }
}

// ── Lever public API (free, no key needed) ───────────────────────────────────
async function fetchLever(slug: string, keywords: string): Promise<JobInput[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json: {
      text?: string; hostedUrl?: string;
      categories?: { location?: string; team?: string; commitment?: string };
      descriptionPlain?: string; createdAt?: number;
    }[] = await res.json();
    const kw = keywords.toLowerCase().split(/[\s,]+/).filter(Boolean);

    return (Array.isArray(json) ? json : [])
      .filter((j) => !kw.length || kw.some((k) => j.text?.toLowerCase().includes(k)))
      .map((j) => ({
        source:      "lever",
        title:       j.text || "",
        company:     slug,
        location:    j.categories?.location || null,
        url:         j.hostedUrl || "",
        description: j.descriptionPlain?.slice(0, 800) || null,
        salary:      null,
        tags:        [j.categories?.team, j.categories?.commitment].filter(Boolean) as string[],
        posted_at:   j.createdAt ? new Date(j.createdAt).toISOString() : null,
      }))
      .filter((j) => j.title && j.url);
  } catch { return []; }
}

// ── Workable public API ───────────────────────────────────────────────────────
async function fetchWorkable(subdomain: string, keywords: string): Promise<JobInput[]> {
  try {
    const res = await fetch(
      `https://apply.workable.com/api/v3/accounts/${subdomain}/jobs`,
      { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: keywords, limit: 50 }),
        next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.results || []).map((j: {
      title?: string; url?: string; location?: { city?: string; country?: string };
      shortcode?: string; published_on?: string; department?: string[];
    }) => ({
      source:   "workable",
      title:    j.title || "",
      company:  subdomain,
      location: j.location ? [j.location.city, j.location.country].filter(Boolean).join(", ") : null,
      url:      j.url || `https://apply.workable.com/${subdomain}/j/${j.shortcode}`,
      description: null,
      salary:   null,
      tags:     j.department || [],
      posted_at: j.published_on || null,
    })).filter((j: JobInput) => j.title && j.url);
  } catch { return []; }
}

// ── Generic career page: Jina Reader → AI extraction ────────────────────────
async function fetchCompanyPage(careerUrl: string, keywords: string): Promise<JobInput[]> {
  // Auto-detect Greenhouse
  const ghMatch = careerUrl.match(/(?:boards\.greenhouse\.io|greenhouse\.io\/jobs)\/([^/?#]+)/i);
  if (ghMatch) return fetchGreenhouse(ghMatch[1], keywords);

  // Auto-detect Lever
  const levMatch = careerUrl.match(/jobs\.lever\.co\/([^/?#]+)/i);
  if (levMatch) return fetchLever(levMatch[1], keywords);

  // Auto-detect Workable
  const wkMatch = careerUrl.match(/(?:apply\.workable\.com|([^.]+)\.workable\.com)\/([^/?#]+)?/i);
  if (wkMatch) return fetchWorkable(wkMatch[1] || wkMatch[2], keywords);

  // Generic: fetch via Jina Reader (converts any page to clean markdown)
  try {
    const jinaRes = await fetch(`https://r.jina.ai/${careerUrl}`, {
      headers: { "Accept": "text/plain", "X-Return-Format": "markdown" },
    });
    if (!jinaRes.ok) return [];
    const markdown = await jinaRes.text();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return [];

    // Use AI to extract job listings from markdown
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://jobflow.ai",
        "X-Title": "JobFlow AI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Extract job listings from the content below. Return ONLY valid JSON: {"jobs":[{"title":"...","company":"...","location":"...","url":"...","description":"...","salary":"..."}]}

Filter to include only jobs related to: "${keywords}"
If no matching jobs, return {"jobs":[]}.

Page content:
${markdown.slice(0, 6000)}`,
        }],
      }),
    });

    if (!aiRes.ok) return [];
    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON (model may wrap it in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    const hostname = new URL(careerUrl).hostname.replace(/^www\./, "");

    return (parsed.jobs || [])
      .map((j: { title?: string; company?: string; location?: string; url?: string; description?: string; salary?: string }) => ({
        source:      "company",
        title:       j.title || "",
        company:     j.company || hostname,
        location:    j.location || null,
        url:         j.url || careerUrl,
        description: j.description?.slice(0, 800) || null,
        salary:      j.salary || null,
        tags:        [],
        posted_at:   null,
      }))
      .filter((j: JobInput) => j.title && j.url);
  } catch { return []; }
}

// ── Remotive (free public API) ───────────────────────────────────────────────
async function fetchRemotive(keywords: string): Promise<JobInput[]> {
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
async function fetchRemoteOK(keywords: string): Promise<JobInput[]> {
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
): Promise<JobInput[]> {
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
    const allJobs: JobInput[] = [];

    // Fetch from all selected sources in parallel
    const fetches: Promise<JobInput[]>[] = [];

    if (sources.includes("remotive"))     fetches.push(fetchRemotive(keywords));
    if (sources.includes("remoteok"))     fetches.push(fetchRemoteOK(keywords));
    if (sources.includes("indeed_rss") && alert.indeed_rss_url) {
      fetches.push(fetchRSS(alert.indeed_rss_url, "indeed"));
    }
    if (sources.includes("custom_rss")) {
      for (const url of (alert.custom_rss_urls || [])) {
        fetches.push(fetchRSS(url, "custom"));
      }
    }
    // Company pages: Greenhouse / Lever / Workable auto-detect + Jina+AI fallback
    if (sources.includes("company_pages")) {
      for (const url of (alert.company_page_urls || [])) {
        fetches.push(fetchCompanyPage(url, keywords));
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
