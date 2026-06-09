"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search, Plus, RefreshCw, Bookmark, X, ExternalLink,
  Bell, BellOff, Trash2, ChevronDown, ChevronUp, MapPin,
  Building2, Tag, Clock, Sparkles, Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDate } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────────────────
interface Alert {
  id: string;
  name: string;
  keywords: string;
  location: string | null;
  sources: string[];
  indeed_rss_url: string | null;
  custom_rss_urls: string[];
  company_page_urls: string[];
  is_active: boolean;
  last_checked_at: string | null;
  new_count: number;
}

interface Job {
  id: string;
  alert_id: string;
  source: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description: string | null;
  salary: string | null;
  tags: string[];
  posted_at: string | null;
  is_new: boolean;
  is_saved: boolean;
  is_dismissed: boolean;
  first_seen_at: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  indeed:     { label: "Indeed",       color: "bg-blue-500/15 text-blue-400" },
  remotive:   { label: "Remotive",     color: "bg-green-500/15 text-green-400" },
  remoteok:   { label: "RemoteOK",     color: "bg-orange-500/15 text-orange-400" },
  greenhouse: { label: "Greenhouse",   color: "bg-emerald-500/15 text-emerald-400" },
  lever:      { label: "Lever",        color: "bg-rose-500/15 text-rose-400" },
  workable:   { label: "Workable",     color: "bg-purple-500/15 text-purple-400" },
  company:    { label: "Career Page",  color: "bg-cyan-500/15 text-cyan-400" },
  custom:     { label: "Custom RSS",   color: "bg-violet-500/15 text-violet-400" },
};

const AVAILABLE_SOURCES = [
  { id: "company_pages", label: "🏢 Company Career Pages", desc: "Any company URL — auto-detects Greenhouse, Lever, Workable, or uses AI to extract jobs" },
  { id: "remotive",      label: "Remotive",                desc: "Remote jobs API (free, no key needed)" },
  { id: "remoteok",      label: "RemoteOK",                desc: "Remote tech jobs (free, no key needed)" },
  { id: "indeed_rss",    label: "Indeed RSS",              desc: "Paste your Indeed search RSS URL" },
  { id: "custom_rss",    label: "Custom RSS Feed",         desc: "Any job site with RSS feed" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScoutPage() {
  const [alerts,        setAlerts]        = useState<Alert[]>([]);
  const [activeAlert,   setActiveAlert]   = useState<Alert | null>(null);
  const [jobs,          setJobs]          = useState<Job[]>([]);
  const [filter,        setFilter]        = useState<"new" | "saved" | "all">("new");
  const [loading,       setLoading]       = useState(true);
  const [scraping,      setScraping]      = useState(false);
  const [jobsLoading,   setJobsLoading]   = useState(false);
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAlert,   setEditingAlert]   = useState<Alert | null>(null);
  const activeAlertRef = useRef<Alert | null>(null);
  activeAlertRef.current = activeAlert;

  // New alert form state
  const [form, setForm] = useState({
    name: "", keywords: "", location: "",
    sources: [] as string[],
    indeed_rss_url: "",
    custom_rss_urls: "",
    company_page_urls: "",
  });

  // Edit alert form state
  const [editForm, setEditForm] = useState({
    name: "", keywords: "", location: "",
    sources: [] as string[],
    indeed_rss_url: "",
    custom_rss_urls: "",
    company_page_urls: "",
  });

  // ── Load alerts ────────────────────────────────────────────────────────────
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/alerts");
      const data: Alert[] = await res.json();
      setAlerts(data);
      const current = activeAlertRef.current;
      if (data.length > 0 && !current) {
        setActiveAlert(data[0]);
      } else if (current) {
        // Refresh active alert with latest data (e.g. after edit)
        const refreshed = data.find((a) => a.id === current.id);
        if (refreshed) setActiveAlert(refreshed);
      }
    } catch { toast.error("Failed to load alerts"); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // ── Load jobs for active alert ─────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    if (!activeAlert) return;
    setJobsLoading(true);
    try {
      const res = await fetch(
        `/api/jobs/listings?alertId=${activeAlert.id}&filter=${filter}`
      );
      const data = await res.json();
      setJobs(data);
    } catch { /* ignore */ }
    setJobsLoading(false);
  }, [activeAlert, filter]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // ── Scrape now ─────────────────────────────────────────────────────────────
  async function handleScrape() {
    if (!activeAlert) return;
    setScraping(true);
    try {
      const res  = await fetch("/api/jobs/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: activeAlert.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.newCount > 0) {
        toast.success(`🎉 ${data.newCount} new job${data.newCount > 1 ? "s" : ""} found!`);
        setFilter("new");
      } else {
        toast("No new jobs found — check back later", { icon: "🔍" });
      }
      await loadAlerts();
      await loadJobs();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Scrape failed");
    }
    setScraping(false);
  }

  // ── Create alert ───────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!form.name || !form.keywords || form.sources.length === 0) {
      toast.error("Fill in name, keywords, and at least one source");
      return;
    }
    try {
      const body = {
        name:         form.name.trim(),
        keywords:     form.keywords.trim(),
        location:     form.location.trim() || null,
        sources:      form.sources,
        indeed_rss_url: form.indeed_rss_url.trim() || null,
        custom_rss_urls: form.custom_rss_urls
          ? form.custom_rss_urls.split("\n").map((u) => u.trim()).filter(Boolean)
          : [],
        company_page_urls: form.company_page_urls
          ? form.company_page_urls.split("\n").map((u) => u.trim()).filter(Boolean)
          : [],
      };
      const res = await fetch("/api/jobs/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Alert created! Click Refresh to find jobs 🔍");
      setDialogOpen(false);
      setForm({ name: "", keywords: "", location: "", sources: [], indeed_rss_url: "", custom_rss_urls: "", company_page_urls: "" });
      await loadAlerts();
    } catch { toast.error("Failed to create alert"); }
  }

  // ── Open edit dialog (pre-populate form) ──────────────────────────────────
  function openEdit(alert: Alert, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingAlert(alert);
    setEditForm({
      name:              alert.name,
      keywords:          alert.keywords,
      location:          alert.location || "",
      sources:           alert.sources || [],
      indeed_rss_url:    alert.indeed_rss_url || "",
      custom_rss_urls:   (alert.custom_rss_urls || []).join("\n"),
      company_page_urls: (alert.company_page_urls || []).join("\n"),
    });
    setEditDialogOpen(true);
  }

  // ── Update alert ───────────────────────────────────────────────────────────
  async function handleUpdate() {
    if (!editingAlert) return;
    if (!editForm.name || !editForm.keywords || editForm.sources.length === 0) {
      toast.error("Fill in name, keywords, and at least one source");
      return;
    }
    try {
      const body = {
        id:                editingAlert.id,
        name:              editForm.name.trim(),
        keywords:          editForm.keywords.trim(),
        location:          editForm.location.trim() || null,
        sources:           editForm.sources,
        indeed_rss_url:    editForm.indeed_rss_url.trim() || null,
        custom_rss_urls:   editForm.custom_rss_urls
          ? editForm.custom_rss_urls.split("\n").map((u) => u.trim()).filter(Boolean)
          : [],
        company_page_urls: editForm.company_page_urls
          ? editForm.company_page_urls.split("\n").map((u) => u.trim()).filter(Boolean)
          : [],
      };
      const res = await fetch("/api/jobs/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Alert updated!");
      setEditDialogOpen(false);
      setEditingAlert(null);
      await loadAlerts();
    } catch { toast.error("Failed to update alert"); }
  }

  // ── Delete alert ───────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    await fetch("/api/jobs/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadAlerts();
    if (activeAlert?.id === id) setActiveAlert(null);
    toast.success("Alert deleted");
  }

  // ── Job actions ───────────────────────────────────────────────────────────
  async function jobAction(jobId: string, action: "save" | "unsave" | "dismiss") {
    await fetch("/api/jobs/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: jobId, action }),
    });
    setJobs((prev) =>
      prev
        .map((j) => j.id === jobId
          ? {
              ...j,
              is_saved:     action === "save" ? true : action === "unsave" ? false : j.is_saved,
              is_dismissed: action === "dismiss" ? true : j.is_dismissed,
              is_new:       action !== "unsave" ? false : j.is_new,
            }
          : j
        )
        .filter((j) => !j.is_dismissed || filter !== "new")
    );
  }

  const totalNew = alerts.reduce((s, a) => s + (a.new_count || 0), 0);

  return (
    <AppLayout title="Job Scout">
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">

        {/* ── Left sidebar: alerts ──────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Job Alerts</p>
              {totalNew > 0 && (
                <p className="text-xs text-primary">{totalNew} new jobs</p>
              )}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>New Job Alert</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label>Alert name</Label>
                      <Input placeholder="e.g. PM jobs in Amsterdam" value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Keywords</Label>
                      <Input placeholder="product manager" value={form.keywords}
                        onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Location (optional)</Label>
                      <Input placeholder="Amsterdam, Remote…" value={form.location}
                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sources to search</Label>
                    <div className="space-y-2">
                      {AVAILABLE_SOURCES.map((s) => (
                        <label key={s.id} className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          form.sources.includes(s.id)
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:bg-accent/50"
                        )}>
                          <input type="checkbox" className="mt-0.5"
                            checked={form.sources.includes(s.id)}
                            onChange={(e) => setForm((f) => ({
                              ...f,
                              sources: e.target.checked
                                ? [...f.sources, s.id]
                                : f.sources.filter((x) => x !== s.id),
                            }))} />
                          <div>
                            <p className="text-sm font-medium">{s.label}</p>
                            <p className="text-xs text-muted-foreground">{s.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {form.sources.includes("indeed_rss") && (
                    <div className="space-y-1.5">
                      <Label>Indeed RSS URL</Label>
                      <Input
                        placeholder="https://www.indeed.com/rss?q=product+manager&l=Amsterdam"
                        value={form.indeed_rss_url}
                        onChange={(e) => setForm((f) => ({ ...f, indeed_rss_url: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        On Indeed → search jobs → scroll to bottom → copy the RSS link
                      </p>
                    </div>
                  )}

                  {form.sources.includes("company_pages") && (
                    <div className="space-y-1.5">
                      <Label>Company Career Page URLs (one per line)</Label>
                      <textarea
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono text-xs"
                        placeholder={"https://boards.greenhouse.io/stripe\nhttps://jobs.lever.co/discord\nhttps://apply.workable.com/notion\nhttps://careers.microsoft.com/global/en/search-results"}
                        value={form.company_page_urls}
                        onChange={(e) => setForm((f) => ({ ...f, company_page_urls: e.target.value }))}
                      />
                      <div className="rounded-lg bg-muted/50 p-2.5 space-y-1 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground/80">Auto-detected platforms:</p>
                        <p>🌿 <code>boards.greenhouse.io/[company]</code> → Greenhouse API</p>
                        <p>🎯 <code>jobs.lever.co/[company]</code> → Lever API</p>
                        <p>⚙️ <code>apply.workable.com/[company]</code> → Workable API</p>
                        <p>🤖 Any other URL → AI reads the page and extracts jobs</p>
                      </div>
                    </div>
                  )}

                  {form.sources.includes("custom_rss") && (
                    <div className="space-y-1.5">
                      <Label>Custom RSS URLs (one per line)</Label>
                      <textarea
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        placeholder={"https://weworkremotely.com/remote-jobs.rss\nhttps://yoursite.com/jobs.rss"}
                        value={form.custom_rss_urls}
                        onChange={(e) => setForm((f) => ({ ...f, custom_rss_urls: e.target.value }))}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-1">
                    <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create Alert</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* ── Edit Alert Dialog ───────────────────────────────────────── */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Edit Alert</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Alert name</Label>
                    <Input placeholder="e.g. PM jobs in Amsterdam" value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Keywords</Label>
                    <Input placeholder="product manager" value={editForm.keywords}
                      onChange={(e) => setEditForm((f) => ({ ...f, keywords: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location (optional)</Label>
                    <Input placeholder="Amsterdam, Remote…" value={editForm.location}
                      onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sources to search</Label>
                  <div className="space-y-2">
                    {AVAILABLE_SOURCES.map((s) => (
                      <label key={s.id} className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        editForm.sources.includes(s.id)
                          ? "border-primary/40 bg-primary/5"
                          : "border-border hover:bg-accent/50"
                      )}>
                        <input type="checkbox" className="mt-0.5"
                          checked={editForm.sources.includes(s.id)}
                          onChange={(e) => setEditForm((f) => ({
                            ...f,
                            sources: e.target.checked
                              ? [...f.sources, s.id]
                              : f.sources.filter((x) => x !== s.id),
                          }))} />
                        <div>
                          <p className="text-sm font-medium">{s.label}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {editForm.sources.includes("indeed_rss") && (
                  <div className="space-y-1.5">
                    <Label>Indeed RSS URL</Label>
                    <Input
                      placeholder="https://www.indeed.com/rss?q=product+manager&l=Amsterdam"
                      value={editForm.indeed_rss_url}
                      onChange={(e) => setEditForm((f) => ({ ...f, indeed_rss_url: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      On Indeed → search jobs → scroll to bottom → copy the RSS link
                    </p>
                  </div>
                )}

                {editForm.sources.includes("company_pages") && (
                  <div className="space-y-1.5">
                    <Label>Company Career Page URLs (one per line)</Label>
                    <textarea
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none font-mono text-xs"
                      placeholder={"https://boards.greenhouse.io/stripe\nhttps://jobs.lever.co/discord\nhttps://apply.workable.com/notion"}
                      value={editForm.company_page_urls}
                      onChange={(e) => setEditForm((f) => ({ ...f, company_page_urls: e.target.value }))}
                    />
                    <div className="rounded-lg bg-muted/50 p-2.5 space-y-1 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground/80">Auto-detected platforms:</p>
                      <p>🌿 <code>boards.greenhouse.io/[company]</code> → Greenhouse API</p>
                      <p>🎯 <code>jobs.lever.co/[company]</code> → Lever API</p>
                      <p>⚙️ <code>apply.workable.com/[company]</code> → Workable API</p>
                      <p>🤖 Any other URL → AI reads the page and extracts jobs</p>
                    </div>
                  </div>
                )}

                {editForm.sources.includes("custom_rss") && (
                  <div className="space-y-1.5">
                    <Label>Custom RSS URLs (one per line)</Label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                      placeholder={"https://weworkremotely.com/remote-jobs.rss\nhttps://yoursite.com/jobs.rss"}
                      value={editForm.custom_rss_urls}
                      onChange={(e) => setEditForm((f) => ({ ...f, custom_rss_urls: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdate}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1,2].map(i => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-4 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No alerts yet</p>
                <p className="text-xs text-muted-foreground/70">Click + to create one</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveAlert(alert)}
                  onKeyDown={(e) => e.key === "Enter" && setActiveAlert(alert)}
                  className={cn(
                    "w-full text-left rounded-lg p-3 transition-colors group cursor-pointer",
                    activeAlert?.id === alert.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-medium truncate flex-1">{alert.name}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {alert.new_count > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-semibold">
                          {alert.new_count}
                        </span>
                      )}
                      <button
                        onClick={(e) => openEdit(alert, e)}
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:text-primary"
                        title="Edit alert"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
                        className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:text-destructive"
                        title="Delete alert"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.keywords}</p>
                  {alert.last_checked_at && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Last: {formatDate(alert.last_checked_at)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Main panel: jobs ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!activeAlert ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Job Scout</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Create a job alert, choose your sources, and hit Refresh to automatically pull new openings matching your criteria.
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Create First Alert
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-4 bg-card">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate">{activeAlert.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {activeAlert.keywords}
                    {activeAlert.location ? ` · ${activeAlert.location}` : ""}
                    {" · "}
                    {activeAlert.sources.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Filter tabs */}
                  <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                    {(["new", "saved", "all"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          "px-3 py-1.5 capitalize transition-colors",
                          filter === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                        )}
                      >
                        {f === "new" && activeAlert.new_count > 0 ? `New (${activeAlert.new_count})` : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleScrape}
                    disabled={scraping}
                    className="gap-1.5"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", scraping && "animate-spin")} />
                    {scraping ? "Checking…" : "Refresh"}
                  </Button>
                </div>
              </div>

              {/* Jobs list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {jobsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rounded-xl border border-border p-4 animate-pulse">
                        <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {filter === "new" ? "No new jobs yet" : `No ${filter} jobs`}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Click <strong>Refresh</strong> to check for new openings
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {jobs.map((job, i) => (
                      <JobCard key={job.id} job={job} index={i} onAction={jobAction} />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ── Job card component ────────────────────────────────────────────────────────
function JobCard({
  job, index, onAction,
}: {
  job: Job;
  index: number;
  onAction: (id: string, action: "save" | "unsave" | "dismiss") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_LABELS[job.source] || { label: job.source, color: "bg-muted text-muted-foreground" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "rounded-xl border bg-card transition-colors",
        job.is_new ? "border-primary/30 bg-primary/5" : "border-border",
        job.is_saved && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {job.is_new && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  New
                </span>
              )}
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", src.color)}>
                {src.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-snug mb-1">{job.title}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {job.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />{job.company}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{job.location}
                </span>
              )}
              {job.salary && (
                <span className="font-medium text-emerald-500">{job.salary}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : formatDate(job.first_seen_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onAction(job.id, job.is_saved ? "unsave" : "save")}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                job.is_saved
                  ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
              )}
              title={job.is_saved ? "Unsave" : "Save"}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Open job"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={() => onAction(job.id, "dismiss")}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {job.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {job.tags.map((t) => (
              <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}

        {/* Expandable description */}
        {job.description && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide" : "Show"} description
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden"
                >
                  {job.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
