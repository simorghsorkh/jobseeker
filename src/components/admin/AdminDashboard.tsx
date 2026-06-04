"use client";

import { useState } from "react";
import {
  Bot, CheckCircle2, XCircle, Loader2, Save,
  Zap, Activity, Database, RefreshCw, ExternalLink, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Model catalogue ─────────────────────────────────────────────────────────

export const OPENROUTER_MODELS = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    color: "violet",
    description: "Best balance of intelligence and speed",
    tier: "Recommended",
    recommended: true,
  },
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    color: "violet",
    description: "Fastest Claude — great for quick tasks",
    tier: "Fast",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    color: "emerald",
    description: "OpenAI's flagship multimodal model",
    tier: "Premium",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    color: "emerald",
    description: "Fast and cost-effective OpenAI model",
    tier: "Fast",
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini Flash 1.5",
    provider: "Google",
    color: "blue",
    description: "Ultra-fast with 1M token context window",
    tier: "Fast",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5",
    provider: "Google",
    color: "blue",
    description: "Google's premium model, huge context",
    tier: "Standard",
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "Meta",
    color: "orange",
    description: "Best open-source model, very capable",
    tier: "Standard",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    color: "amber",
    description: "European AI, privacy-focused alternative",
    tier: "Standard",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    color: "cyan",
    description: "Excellent performance at low cost",
    tier: "Fast",
  },
  {
    id: "x-ai/grok-2-1212",
    name: "Grok 2",
    provider: "xAI",
    color: "gray",
    description: "xAI's latest reasoning model",
    tier: "Standard",
  },
] as const;

const PROVIDER_COLORS: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  amber:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  cyan:   "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  gray:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const TIER_COLORS: Record<string, string> = {
  Recommended: "bg-primary/10 text-primary",
  Premium:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Standard:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Fast:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminDashboardProps {
  currentModel: string;
  aiEnabled: boolean;
  appCount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboard({
  currentModel: initialModel,
  aiEnabled: initialEnabled,
  appCount,
}: AdminDashboardProps) {
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [aiEnabled, setAiEnabled] = useState(initialEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "err">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [customModel, setCustomModel] = useState(
    OPENROUTER_MODELS.some((m) => m.id === initialModel) ? "" : initialModel
  );
  const [useCustom, setUseCustom] = useState(
    !OPENROUTER_MODELS.some((m) => m.id === initialModel)
  );

  const activeModel = useCustom ? customModel : selectedModel;

  const handleSave = async () => {
    if (!activeModel.trim()) { toast.error("Select or enter a model"); return; }
    setIsSaving(true);
    try {
      await Promise.all([
        fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "ai_model", value: activeModel.trim() }),
        }),
        fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "ai_enabled", value: String(aiEnabled) }),
        }),
      ]);
      toast.success("Settings saved — new model active immediately");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus("idle");
    setTestMessage("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: 'Reply with exactly: {"status":"ok"}',
          system: "You are a test endpoint. Reply with valid JSON only.",
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setTestStatus("ok");
        setTestMessage(`Model: ${data.model || activeModel}`);
      } else {
        setTestStatus("err");
        setTestMessage(data.error || "No response");
      }
    } catch (e) {
      setTestStatus("err");
      setTestMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setIsTesting(false);
    }
  };

  const currentModelInfo = OPENROUTER_MODELS.find((m) => m.id === initialModel);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage AI configuration and system settings
        </p>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">Total Applications</span>
          </div>
          <p className="text-2xl font-bold">{appCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium">AI Status</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            {aiEnabled
              ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              : <XCircle className="h-5 w-5 text-red-500" />
            }
            <span className="text-sm font-semibold">{aiEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Active Model</span>
          </div>
          <p className="text-sm font-semibold truncate">
            {currentModelInfo?.name || initialModel}
          </p>
          {currentModelInfo && (
            <p className="text-xs text-muted-foreground">{currentModelInfo.provider}</p>
          )}
        </div>
      </div>

      {/* ── OpenRouter status card ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">🔀</span>
              OpenRouter API
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified gateway — access 200+ models with a single API key
            </p>
          </div>
          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Browse all models <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="h-8 text-xs gap-1.5"
          >
            {isTesting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />
            }
            Test Connection
          </Button>

          {testStatus === "ok" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected — {testMessage}
            </span>
          )}
          {testStatus === "err" && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <XCircle className="h-3.5 w-3.5" />
              {testMessage}
            </span>
          )}
        </div>

        {/* AI enabled toggle */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors",
                aiEnabled ? "bg-primary" : "bg-muted"
              )}
              onClick={() => setAiEnabled(!aiEnabled)}
            >
              <div className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                aiEnabled ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-sm font-medium">AI Features Enabled</span>
          </label>
          <span className="text-xs text-muted-foreground">
            Disabling this turns off all AI-generated content across the app
          </span>
        </div>
      </div>

      {/* ── Model selection ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-1">Select AI Model</h2>
        <p className="text-xs text-muted-foreground mb-4">
          The selected model will be used for all AI features — summaries, match scoring, cover letters, etc.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {OPENROUTER_MODELS.map((model) => {
            const isSelected = !useCustom && selectedModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => { setSelectedModel(model.id); setUseCustom(false); }}
                className={cn(
                  "relative text-left rounded-lg border p-3 transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border bg-background hover:bg-muted/30"
                )}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                {"recommended" in model && model.recommended && !isSelected && (
                  <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    ★
                  </span>
                )}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", PROVIDER_COLORS[model.color])}>
                    {model.provider}
                  </span>
                </div>
                <p className="text-xs font-semibold leading-snug">{model.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                  {model.description}
                </p>
                <div className="mt-2">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", TIER_COLORS[model.tier])}>
                    {model.tier}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Custom model card */}
          <button
            onClick={() => setUseCustom(true)}
            className={cn(
              "relative text-left rounded-lg border p-3 transition-all hover:border-primary/50",
              useCustom
                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                : "border-dashed border-border hover:bg-muted/30"
            )}
          >
            {useCustom && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <Check className="h-2.5 w-2.5 text-white" />
              </span>
            )}
            <p className="text-xs font-semibold">Custom Model</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter any OpenRouter model ID
            </p>
            {useCustom && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g. openai/o3-mini"
                className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </button>
        </div>

        {/* Save row */}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Active:{" "}
            <span className="font-mono font-medium text-foreground">{activeModel || "—"}</span>
          </p>
          <Button size="sm" onClick={handleSave} isLoading={isSaving} className="h-8 text-xs gap-1.5">
            <Save className="h-3.5 w-3.5" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* ── Info box ─────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">How it works:</strong> All AI features call{" "}
          <code className="font-mono text-xs bg-muted px-1 rounded">/api/ai/chat</code> on your server,
          which proxies to OpenRouter using your API key. Model selection is stored in the database and
          takes effect immediately — no redeploy needed. Your API key is only stored in environment
          variables and never exposed to the browser.
        </p>
      </div>

    </div>
  );
}
