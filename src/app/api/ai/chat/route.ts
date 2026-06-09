import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

async function getSelectedModel(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "ai_model")
      .single();
    return data?.value || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, system } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured. Add OPENROUTER_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const model = await getSelectedModel();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://jobflow.ai",
        "X-Title": "JobFlow AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `OpenRouter error ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from model");

    return NextResponse.json({ content, model });
  } catch (error: unknown) {
    console.error("AI API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
