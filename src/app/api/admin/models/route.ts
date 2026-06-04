import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  context_length: number;
  provider: string;
  is_free: boolean;
  prompt_price: string;
  completion_price: string;
}

function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return true;
  return email === adminEmail;
}

function extractProvider(modelId: string): string {
  const prefix = modelId.split("/")[0];
  const map: Record<string, string> = {
    anthropic:   "Anthropic",
    openai:      "OpenAI",
    google:      "Google",
    "meta-llama":"Meta",
    mistralai:   "Mistral",
    deepseek:    "DeepSeek",
    "x-ai":      "xAI",
    microsoft:   "Microsoft",
    qwen:        "Qwen / Alibaba",
    cohere:      "Cohere",
    "01-ai":     "01.AI",
    perplexity:  "Perplexity",
    nousresearch:"Nous Research",
    databricks:  "Databricks",
    amazon:      "Amazon",
    "amazon-bedrock": "AWS Bedrock",
    nvidia:      "NVIDIA",
    liquid:      "Liquid AI",
    inflection:  "Inflection",
    pygmalionai: "PygmalionAI",
    sophosympatheia: "Sophosympatheia",
  };
  return map[prefix] || prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export async function GET(request: NextRequest) {
  try {
    // Admin-only endpoint
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const freeOnly = searchParams.get("free") === "true";

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://jobflow.ai",
        "X-Title": "JobFlow AI",
      },
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error(`OpenRouter responded with ${res.status}`);
    }

    const json = await res.json();
    const raw: OpenRouterModel[] = json.data || [];

    const models: ModelInfo[] = raw
      .map((m) => {
        const promptPrice  = m.pricing?.prompt      ?? "0";
        const compPrice    = m.pricing?.completion  ?? "0";
        const free         = promptPrice === "0" && compPrice === "0";
        return {
          id:               m.id,
          name:             m.name || m.id,
          description:      m.description || "",
          context_length:   m.context_length ?? 0,
          provider:         extractProvider(m.id),
          is_free:          free,
          prompt_price:     promptPrice,
          completion_price: compPrice,
        };
      })
      .filter((m) => !freeOnly || m.is_free)
      .sort((a, b) => {
        // Free models first, then alphabetically by provider+name
        if (a.is_free !== b.is_free) return a.is_free ? -1 : 1;
        return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name);
      });

    return NextResponse.json({ models, total: models.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
