"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot, CheckCircle2, XCircle, Loader2, Save,
  Zap, Activity, Database, RefreshCw, ExternalLink,
  Check, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ModelInfo } from "@/app/api/admin/models/route";

// ─── Provider colours ─────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic:        "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  OpenAI:           "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Google:           "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Meta:             "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Mistral:          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  DeepSeek:         "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  xAI:              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Microsoft:        "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "Qwen / Alibaba": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Cohere:           "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};
const DEFAULT_PROVIDER_COLOR = "bg-muted text-muted-foreground";

function providerColor(provider: string) {
  return PROVIDER_COLORS[provider] ?? DEFAULT_PROVIDER_COLOR;
}

function formatCtx(n: number) {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M ctx`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K ctx`;
  return `${n} ctx`;
}

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
  const [aiEnabled, setAiEnabled]         = useState(initialEnabled);
  const [isSaving, setIsSaving]           = useState(false);
  const [isTesting, setIsTesting]         = useState(false);
  const [testStatus, setTestStatus]       = useState<"idle" | "ok" | "err">("idle");
  const [testMessage, setTestMessage]     = useState("");

  // Models state
  const [models, setModels]       = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError]           = useState("");
  const [freeOnly, setFreeOnly]               = useState(true);
  const [search, setSearch]                   = useState("");
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  // Custom model override
  const [useCustom, setUseCustom] = useState(false);
  const [customModel, setCustomModel] = useState("");

  const activeModel = useCustom ? customModel.trim() : selectedModel;

  // ── Fetch models ─────────────────────────────────────────────────────────────

  const fetchModels = useCallback(async (free: boolean) => {
    setIsLoadingModels(true);
    setModelError("");
    try {
      const res = await fetch(`/api/admin/models?free=${free}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `HTTP ${res.status}`); }
      const { models: data } = await res.json();
      setModels(data);
      // Auto-expand providers that contain the current model
      const providerOfCurrent = data.find((m: ModelInfo) => m.id === selectedModel)?.provider;
      if (providerOfCurrent) setExpandedProviders(new Set([providerOfCurrent]));
    } catch (e) {
      setModelError(e instanceof Error ? e.message : "Failed to load models");
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedModel]);

  useEffect(() => { fetchModels(freeOnly); }, [freeOnly, fetchModels]);

  // ── Grouped & filtered models ─────────────────────────────────────────────

  const filtered = models.filter((m) =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase()) ||
    m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, ModelInfo[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  const providers = Object.keys(grouped).sort();

  const toggleProvider = (p: string) =>
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const model = activeModel;
    if (!model) { toast.error("Select or enter a model"); return; }
    setIsSaving(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "ai_model",   value: model }) }),
        fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "ai_enabled", value: String(aiEnabled) }) }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Save failed");
      toast.success("Settings saved — model active immediately");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Test connection ───────────────────────────────────────────────────────

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
        setTestMessage(data.model || activeModel);
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage AI configuration and system settings
        </p>
      </div>

      {/* Stats */}
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
              : <XCircle className="h-5 w-5 text-red-500" />}
            <span className="text-sm font-semibold">{aiEnabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Active Model</span>
          </div>
          <p className="text-xs font-semibold truncate font-mono">{initialModel}</p>
        </div>
      </div>

      {/* OpenRouter status */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-lg">🔀</span> OpenRouter API
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified gateway — access 200+ models with your single API key
            </p>
          </div>
          <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            Browse all models <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting} className="h-8 text-xs gap-1.5">
            {isTesting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
            Test Connection
          </Button>
          {testStatus === "ok" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected — {testMessage}
            </span>
          )}
          {testStatus === "err" && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <XCircle className="h-3.5 w-3.5" /> {testMessage}
            </span>
          )}
        </div>

        {/* AI toggle */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer" onClick={() => setAiEnabled(!aiEnabled)}>
            <div className={cn("relative w-9 h-5 rounded-full transition-colors", aiEnabled ? "bg-primary" : "bg-muted")}>
              <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", aiEnabled ? "translate-x-4" : "translate-x-0.5")} />
            </div>
            <span className="text-sm font-medium">AI Features Enabled</span>
          </label>
          <span className="text-xs text-muted-foreground">Disabling turns off all AI content across the app</span>
        </div>
      </div>

      {/* Model selection */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold">Select AI Model</h2>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
              <div
                className={cn("relative w-7 h-4 rounded-full transition-colors", freeOnly ? "bg-emerald-500" : "bg-muted")}
                onClick={() => setFreeOnly(!freeOnly)}
              >
                <div className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform", freeOnly ? "translate-x-3" : "translate-x-0.5")} />
              </div>
              Free only
            </label>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
              onClick={() => fetchModels(freeOnly)} disabled={isLoadingModels}>
              <RefreshCw className={cn("h-3 w-3", isLoadingModels && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {freeOnly
            ? "Showing free-tier models only (prompt & completion price = $0)"
            : "Showing all available OpenRouter models"}
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Model list */}
        {isLoadingModels ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Fetching models from OpenRouter...</span>
          </div>
        ) : modelError ? (
          <div className="flex items-center gap-2 py-6 justify-center text-destructive text-sm">
            <XCircle className="h-4 w-4" /> {modelError}
          </div>
        ) : providers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No models found</p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {providers.map((provider) => {
              const pModels = grouped[provider];
              const isOpen = expandedProviders.has(provider);
              const hasSelected = pModels.some((m) => m.id === selectedModel);

              return (
                <div key={provider} className="rounded-lg border border-border overflow-hidden">
                  {/* Provider header */}
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors",
                      hasSelected && "bg-primary/5"
                    )}
                    onClick={() => toggleProvider(provider)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded", providerColor(provider))}>
                        {provider}
                      </span>
                      <span className="text-xs text-muted-foreground">{pModels.length} model{pModels.length !== 1 ? "s" : ""}</span>
                      {hasSelected && (
                        <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> selected
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>

                  {/* Models grid */}
                  {isOpen && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-muted/20 border-t border-border sm:grid-cols-3">
                      {pModels.map((m) => {
                        const isSelected = !useCustom && selectedModel === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedModel(m.id); setUseCustom(false); }}
                            className={cn(
                              "relative text-left rounded-lg border p-2.5 transition-all hover:border-primary/50 bg-background",
                              isSelected
                                ? "border-primary shadow-sm shadow-primary/10"
                                : "border-border hover:bg-muted/30"
                            )}
                          >
                            {isSelected && (
                              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                <Check className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                            <div className="flex items-center gap-1 mb-1">
                              {m.is_free && (
                                <span className="text-xs px-1.5 py-0 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                                  FREE
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold leading-snug line-clamp-2 pr-4">{m.name}</p>
                            {m.context_length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">{formatCtx(m.context_length)}</p>
                            )}
                            <p className="text-xs font-mono text-muted-foreground/70 mt-1 truncate">{m.id}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Custom model */}
        <div className="mt-3 pt-3 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer mb-2" onClick={() => setUseCustom(!useCustom)}>
            <div className={cn("relative w-7 h-4 rounded-full transition-colors", useCustom ? "bg-primary" : "bg-muted")}>
              <div className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform", useCustom ? "translate-x-3" : "translate-x-0.5")} />
            </div>
            <span className="text-xs font-medium">Use custom model ID</span>
          </label>
          {useCustom && (
            <Input
              className="h-8 text-xs font-mono"
              placeholder="e.g. openai/o3-mini  or  google/gemini-2.0-flash-exp:free"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
            />
          )}
        </div>

        {/* Save row */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Will save:{" "}
            <span className="font-mono font-medium text-foreground">{activeModel || "—"}</span>
          </p>
          <Button size="sm" onClick={handleSave} isLoading={isSaving} className="h-8 text-xs gap-1.5">
            <Save className="h-3.5 w-3.5" /> Save Settings
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">How it works:</strong> All AI calls go through{" "}
          <code className="font-mono text-xs bg-muted px-1 rounded">/api/ai/chat</code>, which proxies
          to OpenRouter using your server-side API key. The active model is stored in the database
          and applied immediately — no redeploy needed. Free models (marked FREE) have $0 pricing
          per token on OpenRouter.
        </p>
      </div>

    </div>
  );
}
