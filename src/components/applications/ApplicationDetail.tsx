"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Trash2, Archive, Bookmark, BookmarkCheck,
  ExternalLink, Building2, MapPin, Briefcase, Calendar, User,
  Mail, Link as LinkedinIcon, Link2, Globe, DollarSign, Sparkles,
  FileText, Clock, Bell, Tag, Save, X, Star, Languages, AlertCircle,
  StickyNote, Send, Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { MatchScore } from "./MatchScore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationTimeline } from "./ApplicationTimeline";
import { ApplicationNotes } from "./ApplicationNotes";
import { ApplicationFiles } from "./ApplicationFiles";
import { ApplicationReminders } from "./ApplicationReminders";
import { AIApplicationPanel } from "@/components/ai/AIApplicationPanel";
import { InterviewTab } from "./InterviewTab";
import {
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
} from "@/lib/db/applications";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatSalary, cn } from "@/lib/utils";
import {
  STATUS_CONFIG, KANBAN_STATUSES, WORK_MODES,
  EMPLOYMENT_TYPES, SENIORITY_LEVELS,
} from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/lib/types";
import toast from "react-hot-toast";

interface ApplicationDetailProps {
  application: Application;
}

export function ApplicationDetail({ application: initialApp }: ApplicationDetailProps) {
  const router = useRouter();
  const { updateApplication: updateInStore, removeApplication } = useAppStore();
  const [app, setApp] = useState(initialApp);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ ...initialApp });

  const updateField = (key: string, value: unknown) =>
    setEditData((prev) => ({ ...prev, [key]: value }));

  const handleStatusChange = async (status: ApplicationStatus) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updated = await updateApplicationStatus(app.id, status, user.id);
    setApp((prev) => ({ ...prev, status }));
    updateInStore(app.id, { status, updated_at: updated.updated_at });
    toast.success(`Status → ${STATUS_CONFIG[status].label}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateApplication(app.id, editData);
      setApp({ ...app, ...updated });
      updateInStore(app.id, updated);
      setIsEditing(false);
      toast.success("Saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    await deleteApplication(app.id);
    removeApplication(app.id);
    router.push("/applications");
    toast.success("Deleted");
  };

  const toggleBookmark = async () => {
    const next = !app.is_bookmarked;
    setApp((prev) => ({ ...prev, is_bookmarked: next }));
    updateInStore(app.id, { is_bookmarked: next });
    await updateApplication(app.id, { is_bookmarked: next });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-sm px-6">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{app.job_title}</span>
            <span className="text-xs text-muted-foreground truncate">{app.company_name}</span>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="flex items-center gap-2">
          <Select value={app.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={toggleBookmark} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            {app.is_bookmarked
              ? <BookmarkCheck className="h-4 w-4 text-primary" />
              : <Bookmark className="h-4 w-4 text-muted-foreground" />
            }
          </button>
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} isLoading={isSaving} className="h-8 text-xs">
                <Save className="h-3.5 w-3.5" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditData({ ...app }); }} className="h-8 text-xs">
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 text-xs gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Header card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Building2 className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="w-full text-xl font-bold bg-transparent border-b border-border focus:outline-none focus:border-primary pb-1"
                        value={editData.job_title}
                        onChange={(e) => updateField("job_title", e.target.value)}
                      />
                      <input
                        className="w-full text-sm bg-transparent border-b border-border focus:outline-none focus:border-primary pb-1"
                        value={editData.company_name}
                        onChange={(e) => updateField("company_name", e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-xl font-bold">{app.job_title}</h1>
                      <p className="text-muted-foreground">{app.company_name}</p>
                    </>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {app.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />{app.location}
                      </span>
                    )}
                    {app.work_mode && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        {WORK_MODES.find((m) => m.value === app.work_mode)?.label}
                      </span>
                    )}
                    {app.employment_type && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {EMPLOYMENT_TYPES.find((t) => t.value === app.employment_type)?.label}
                      </span>
                    )}
                    {(app.salary_min || app.salary_max) && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatSalary(app.salary_min, app.salary_max, app.salary_currency)}
                      </span>
                    )}
                  </div>
                </div>
                <MatchScore score={app.ai_match_score ?? app.match_score} size="lg" showLabel />
              </div>

              {app.job_url && (
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View job posting
                </a>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-lg gap-1">
                {[
                  { value: "overview", label: "Overview", icon: FileText },
                  { value: "timeline", label: "Timeline", icon: Clock },
                  { value: "notes", label: "Notes", icon: Edit2 },
                  { value: "files", label: "Files", icon: FileText },
                  { value: "reminders", label: "Reminders", icon: Bell },
                  { value: "interview", label: "Interview", icon: Trophy },
                  { value: "ai", label: "AI Tools", icon: Sparkles },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs px-3">
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Job description */}
                {(app.job_description || app.ai_summary) && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {app.ai_summary ? "AI Summary" : "Job Description"}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {app.ai_summary || app.job_description}
                    </p>
                  </div>
                )}

                {/* Motivation */}
                {(app.motivation_notes || app.why_this_role) && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Why This Role
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {app.why_this_role || app.motivation_notes}
                    </p>
                  </div>
                )}

                {/* Interview prep */}
                {app.ai_interview_prep && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      AI Interview Prep
                    </h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {app.ai_interview_prep}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline">
                <ApplicationTimeline applicationId={app.id} />
              </TabsContent>

              <TabsContent value="notes">
                <ApplicationNotes applicationId={app.id} />
              </TabsContent>

              <TabsContent value="files">
                <ApplicationFiles applicationId={app.id} />
              </TabsContent>

              <TabsContent value="reminders">
                <ApplicationReminders applicationId={app.id} />
              </TabsContent>

              <TabsContent value="interview">
                <InterviewTab
                  applicationId={app.id}
                  initialLessonsLearned={app.lessons_learned ?? null}
                />
              </TabsContent>

              <TabsContent value="ai">
                <AIApplicationPanel application={app} onUpdate={(updates) => {
                  setApp((prev) => ({ ...prev, ...updates }));
                  updateInStore(app.id, updates);
                }} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4">Details</h3>
              <dl className="space-y-3">
                {[
                  { label: "Applied", value: formatDate(app.application_date), icon: Calendar },
                  { label: "From", value: app.source?.replace(/_/g, " "), icon: Send },
                  { label: "Industry", value: app.industry, icon: Briefcase },
                  { label: "Language", value: app.description_language, icon: Languages },
                  { label: "Seniority", value: SENIORITY_LEVELS.find(s => s.value === app.seniority_level)?.label, icon: Tag },
                  { label: "CV Version", value: app.cv_version, icon: FileText },
                  { label: "Portfolio", value: app.portfolio_link ? "View →" : null, icon: Globe, href: app.portfolio_link ?? undefined },
                ].filter((r) => r.value).map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <row.icon className="h-3.5 w-3.5" />
                      {row.label}
                    </dt>
                    <dd className="text-xs font-medium capitalize">
                      {"href" in row && row.href ? (
                        <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{row.value}</a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Badge row: Dutch + Sponsorship + Contract */}
              {(app.dutch_required !== null && app.dutch_required !== undefined) ||
               app.visa_sponsorship || app.contract_type ? (
                <div className="mt-4 pt-3 border-t border-border space-y-2.5">
                  {/* Dutch */}
                  {app.dutch_required !== null && app.dutch_required !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Dutch Required?
                      </span>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        app.dutch_required
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {app.dutch_required ? "Required" : "Not required"}
                      </span>
                    </div>
                  )}

                  {/* Visa Sponsorship */}
                  {app.visa_sponsorship && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">🛂 Sponsorship</span>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        app.visa_sponsorship === "yes"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : app.visa_sponsorship === "maybe"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : app.visa_sponsorship === "eu_only"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {app.visa_sponsorship === "yes"     && "✅ Yes"}
                        {app.visa_sponsorship === "maybe"   && "🤔 Maybe"}
                        {app.visa_sponsorship === "eu_only" && "🇪🇺 EU only"}
                        {app.visa_sponsorship === "no"      && "❌ No"}
                      </span>
                    </div>
                  )}

                  {/* Contract Type */}
                  {app.contract_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">📋 Contract Type</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-foreground">
                        {app.contract_type === "permanent"  && "Permanent"}
                        {app.contract_type === "fixed_term" && "Fixed-term"}
                        {app.contract_type === "temporary"  && "Temporary"}
                        {app.contract_type === "payroll"    && "Payroll"}
                        {app.contract_type === "zzp"        && "ZZP / Freelance"}
                        {app.contract_type === "internship" && "Internship"}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Initial Notes card */}
            {app.initial_notes && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-amber-500" />
                  Initial Notes
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {app.initial_notes}
                </p>
              </div>
            )}

            {/* Recruiter card */}
            {(app.recruiter_name || app.contact_email) && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Recruiter
                </h3>
                <div className="space-y-2">
                  {app.recruiter_name && (
                    <p className="text-sm font-medium">{app.recruiter_name}</p>
                  )}
                  {app.contact_email && (
                    <a href={`mailto:${app.contact_email}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <Mail className="h-3.5 w-3.5" />{app.contact_email}
                    </a>
                  )}
                  {app.recruiter_linkedin && (
                    <a href={app.recruiter_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <LinkedinIcon className="h-3.5 w-3.5" />LinkedIn Profile
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
