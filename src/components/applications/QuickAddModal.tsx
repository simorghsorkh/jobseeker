"use client";

import { useState } from "react";
import { Sparkles, Link2, Languages, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import { createApplication } from "@/lib/db/applications";
import { extractJobInfo } from "@/lib/ai/claude";
import {
  KANBAN_STATUSES,
  STATUS_CONFIG,
  WORK_MODES,
  EMPLOYMENT_TYPES,
  APPLICATION_SOURCES,
  INDUSTRIES,
  DESCRIPTION_LANGUAGES,
  VISA_SPONSORSHIP_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus, ApplicationSource, EmploymentType, WorkMode, Application } from "@/lib/types";

export function QuickAddModal() {
  const { isQuickAddOpen, setIsQuickAddOpen, addApplication } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pastedJD, setPastedJD] = useState("");
  const [showJDPaste, setShowJDPaste] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    job_url: "",
    status: "saved" as ApplicationStatus,
    work_mode: "" as WorkMode | "",
    employment_type: "" as EmploymentType | "",
    location: "",
    industry: "",
    source: "" as ApplicationSource | "",
    description_language: "",
    dutch_required: "" as "yes" | "no" | "preferred" | "",
    initial_notes: "",
    visa_sponsorship: "" as Application["visa_sponsorship"] | "",
    contract_type: "" as Application["contract_type"] | "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleExtract = async () => {
    if (!pastedJD.trim()) return;
    setIsExtracting(true);
    try {
      const extracted = await extractJobInfo(pastedJD);
      setForm((prev) => ({
        ...prev,
        company_name: (extracted.company_name as string) || prev.company_name,
        job_title: (extracted.job_title as string) || prev.job_title,
        location: (extracted.location as string) || prev.location,
        work_mode: (extracted.work_mode as WorkMode) || prev.work_mode,
        employment_type: (extracted.employment_type as EmploymentType) || prev.employment_type,
        industry: (extracted.industry as string) || prev.industry,
      }));
      setShowJDPaste(false);
      toast.success("Job info extracted!");
    } catch {
      toast.error("Failed to extract — please fill manually");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.job_title) {
      toast.error("Company name and job title are required");
      return;
    }
    setIsLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dutchMap: Record<string, boolean | null> = {
        yes: true,
        no: false,
        preferred: null,
        "": null,
      };

      const app = await createApplication({
        user_id: user.id,
        company_name: form.company_name,
        job_title: form.job_title,
        job_url: form.job_url || null,
        status: form.status,
        work_mode: (form.work_mode as WorkMode) || null,
        employment_type: (form.employment_type as EmploymentType) || null,
        location: form.location || null,
        industry: form.industry || null,
        source: (form.source as ApplicationSource) || null,
        description_language: form.description_language || null,
        dutch_required:
          form.dutch_required === "preferred"
            ? null
            : form.dutch_required
            ? dutchMap[form.dutch_required]
            : null,
        initial_notes: form.initial_notes || null,
        visa_sponsorship: (form.visa_sponsorship as Application["visa_sponsorship"]) || null,
        contract_type: (form.contract_type as Application["contract_type"]) || null,
        is_bookmarked: false,
        is_archived: false,
        priority: 0,
        tags: [],
        salary_currency: "USD",
        salary_min: null,
        salary_max: null,
        seniority_level: null,
        country: null,
        city: null,
        recruiter_name: null,
        recruiter_linkedin: null,
        contact_email: null,
        application_date:
          form.status !== "saved"
            ? new Date().toISOString().split("T")[0]
            : null,
        job_description: null,
        cv_version: null,
        cover_letter_used: null,
        portfolio_link: null,
        motivation_notes: null,
        why_this_role: null,
        match_score: null,
        ai_summary: null,
        ai_match_score: null,
        ai_interview_prep: null,
      });

      addApplication(app);
      toast.success(`Added "${form.job_title}" at ${form.company_name}`);
      setIsQuickAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to add application");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      company_name: "",
      job_title: "",
      job_url: "",
      status: "saved",
      work_mode: "",
      employment_type: "",
      location: "",
      industry: "",
      source: "",
      description_language: "",
      dutch_required: "",
      initial_notes: "",
      visa_sponsorship: "",
      contract_type: "",
    });
    setPastedJD("");
    setShowJDPaste(false);
  };

  const dutchOptions = [
    { value: "yes", label: "بله — الزامی است" },
    { value: "preferred", label: "ترجیحی (Preferred)" },
    { value: "no", label: "خیر — الزامی نیست" },
  ];

  return (
    <Dialog
      open={isQuickAddOpen}
      onOpenChange={(open) => {
        setIsQuickAddOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {/* AI Extract */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowJDPaste(!showJDPaste)}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Paste job description to auto-fill with AI
            </button>
            {showJDPaste && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={pastedJD}
                  onChange={(e) => setPastedJD(e.target.value)}
                  rows={4}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleExtract}
                  isLoading={isExtracting}
                  disabled={!pastedJD.trim()}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Extract Info
                </Button>
              </div>
            )}
          </div>

          <form id="quick-add-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Company + Title */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  placeholder="Google, Stripe, ASML..."
                  value={form.company_name}
                  onChange={(e) => update("company_name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="Software Engineer, PM..."
                  value={form.job_title}
                  onChange={(e) => update("job_title", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Row 2: URL */}
            <div className="space-y-1.5">
              <Label htmlFor="url">Job URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={form.job_url}
                onChange={(e) => update("job_url", e.target.value)}
                icon={<Link2 className="h-3.5 w-3.5" />}
              />
            </div>

            {/* Row 3: Status + Work Mode + Type */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => update("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Work Mode</Label>
                <Select
                  value={form.work_mode}
                  onValueChange={(v) => update("work_mode", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.employment_type}
                  onValueChange={(v) => update("employment_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Location + Industry */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Amsterdam, Rotterdam, Remote..."
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Industry (صنعت)</Label>
                <Select
                  value={form.industry}
                  onValueChange={(v) => update("industry", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Source + Description Language + Dutch Required */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>From (از کجا اقدام کردم)</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => update("source", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                  زبان آگهی
                </Label>
                <Select
                  value={form.description_language}
                  onValueChange={(v) => update("description_language", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DESCRIPTION_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Dutch الزامی؟
                </Label>
                <Select
                  value={form.dutch_required}
                  onValueChange={(v) => update("dutch_required", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dutchOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 6: Sponsorship + Contract Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <span>🛂</span>
                  Visa Sponsorship
                </Label>
                <Select
                  value={form.visa_sponsorship ?? ""}
                  onValueChange={(v) => update("visa_sponsorship", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اسپانسرشیپ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_SPONSORSHIP_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <span>📋</span>
                  نوع قرارداد
                </Label>
                <Select
                  value={form.contract_type ?? ""}
                  onValueChange={(v) => update("contract_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Contract type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 7: Initial Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="initial_notes">توضیحات اولیه</Label>
              <Textarea
                id="initial_notes"
                placeholder="اولین نظرات، دلایل اقدام، نکات مهم درباره این موقعیت..."
                value={form.initial_notes}
                onChange={(e) => update("initial_notes", e.target.value)}
                rows={3}
              />
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsQuickAddOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" form="quick-add-form" isLoading={isLoading}>
            Add Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
