"use client";

import { useState } from "react";
import { Sparkles, FileText, MessageSquare, Target, Mail, Lightbulb, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateJobSummary,
  generateMatchScore,
  generateInterviewPrep,
  generateCoverLetter,
  generateFollowUpEmail,
  generateCVSuggestions,
} from "@/lib/ai/claude";
import { updateApplication } from "@/lib/db/applications";
import type { Application } from "@/lib/types";
import toast from "react-hot-toast";

interface AIApplicationPanelProps {
  application: Application;
  onUpdate: (updates: Partial<Application>) => void;
}

export function AIApplicationPanel({ application, onUpdate }: AIApplicationPanelProps) {
  const [cvContent, setCvContent] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const runAI = async (key: string, fn: () => Promise<string | { score: number; analysis: string }>) => {
    setLoading((l) => ({ ...l, [key]: true }));
    try {
      const res = await fn();
      const text = typeof res === "string" ? res : JSON.stringify(res, null, 2);
      setResults((r) => ({ ...r, [key]: text }));

      // Auto-save certain results
      if (key === "summary") {
        await updateApplication(application.id, { ai_summary: text });
        onUpdate({ ai_summary: text });
        toast.success("AI summary saved");
      }
      if (key === "interview") {
        await updateApplication(application.id, { ai_interview_prep: text });
        onUpdate({ ai_interview_prep: text });
        toast.success("Interview prep saved");
      }
      if (key === "match" && typeof res !== "string") {
        await updateApplication(application.id, { ai_match_score: res.score });
        onUpdate({ ai_match_score: res.score });
        toast.success(`Match score: ${res.score}/100`);
      }
    } catch {
      toast.error("AI generation failed");
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  };

  const copy = (key: string) => {
    if (results[key]) {
      navigator.clipboard.writeText(results[key]);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      toast.success("Copied!");
    }
  };

  const jd = application.job_description || "";
  const hasJD = jd.trim().length > 20;

  const tools = [
    {
      key: "summary",
      icon: FileText,
      label: "Summarize Job",
      description: "Get a concise AI summary of the job description",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      disabled: !hasJD,
      action: () => runAI("summary", () => generateJobSummary(jd)),
    },
    {
      key: "match",
      icon: Target,
      label: "Match Score",
      description: "AI analysis of how well you match this role",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      disabled: !hasJD || !cvContent,
      needsCv: true,
      action: () => runAI("match", () => generateMatchScore(cvContent, jd)),
    },
    {
      key: "interview",
      icon: MessageSquare,
      label: "Interview Prep",
      description: "Generate tailored interview questions for this role",
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/30",
      disabled: !hasJD,
      action: () => runAI("interview", () =>
        generateInterviewPrep(application.job_title, jd, application.company_name)
      ),
    },
    {
      key: "cover_letter",
      icon: Target,
      label: "Cover Letter",
      description: "Generate a personalized cover letter",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      disabled: !hasJD || !cvContent,
      needsCv: true,
      action: () => runAI("cover_letter", () =>
        generateCoverLetter(
          application.job_title,
          application.company_name,
          jd,
          cvContent,
          application.motivation_notes ?? undefined
        )
      ),
    },
    {
      key: "follow_up",
      icon: Mail,
      label: "Follow-up Email",
      description: "Draft a professional follow-up email",
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/30",
      disabled: false,
      action: () => runAI("follow_up", () =>
        generateFollowUpEmail(
          application.job_title,
          application.company_name,
          application.recruiter_name,
          application.application_date
            ? new Date(application.application_date).toLocaleDateString()
            : "recently"
        )
      ),
    },
    {
      key: "cv_tips",
      icon: Lightbulb,
      label: "CV Suggestions",
      description: "Get suggestions to tailor your CV for this role",
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      disabled: !hasJD || !cvContent,
      needsCv: true,
      action: () => runAI("cv_tips", () => generateCVSuggestions(jd, cvContent)),
    },
  ];

  return (
    <div className="mt-4 space-y-6">
      {/* CV input */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Your CV / Resume
        </p>
        <p className="text-xs text-muted-foreground">
          Paste your CV text to unlock match scoring, cover letters, and CV suggestions.
        </p>
        <Textarea
          placeholder="Paste your CV content here..."
          value={cvContent}
          onChange={(e) => setCvContent(e.target.value)}
          rows={4}
          className="text-xs"
        />
      </div>

      {!hasJD && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-700 dark:text-amber-400">
          Add a job description to this application to unlock most AI tools.
        </div>
      )}

      {/* Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div key={tool.key} className="space-y-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tool.bg}`}>
                  <tool.icon className={`h-4 w-4 ${tool.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{tool.label}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </div>
              {tool.needsCv && !cvContent && (
                <p className="text-[10px] text-muted-foreground mb-2">← Requires CV above</p>
              )}
              <Button
                size="sm"
                className="w-full text-xs h-8"
                onClick={tool.action}
                disabled={tool.disabled}
                isLoading={loading[tool.key]}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </Button>
            </div>

            {results[tool.key] && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 relative">
                <button
                  onClick={() => copy(tool.key)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-accent transition-colors"
                >
                  {copied === tool.key
                    ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                    : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </button>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap pr-6 max-h-48 overflow-y-auto scrollbar-thin">
                  {results[tool.key]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
