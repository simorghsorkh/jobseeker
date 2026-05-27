"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  FileText,
  MessageSquare,
  Target,
  Mail,
  Lightbulb,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/useAppStore";
import {
  generateJobSummary,
  generateInterviewPrep,
  generateCoverLetter,
  generateFollowUpEmail,
  generateCVSuggestions,
} from "@/lib/ai/claude";
import toast from "react-hot-toast";

type AIMode =
  | "home"
  | "summary"
  | "interview"
  | "cover_letter"
  | "follow_up"
  | "cv_suggestions";

const aiTools = [
  {
    id: "summary" as AIMode,
    icon: FileText,
    label: "Summarize JD",
    description: "Get a quick summary of any job description",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "interview" as AIMode,
    icon: MessageSquare,
    label: "Interview Prep",
    description: "Generate tailored interview questions",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    id: "cover_letter" as AIMode,
    icon: Target,
    label: "Cover Letter",
    description: "Generate a personalized cover letter",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    id: "follow_up" as AIMode,
    icon: Mail,
    label: "Follow-up Email",
    description: "Draft a professional follow-up",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    id: "cv_suggestions" as AIMode,
    icon: Lightbulb,
    label: "CV Suggestions",
    description: "Improve your CV for this role",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
];

export function AISidebar() {
  const { isAISidebarOpen, setIsAISidebarOpen } = useAppStore();
  const [mode, setMode] = useState<AIMode>("home");
  const [input, setInput] = useState("");
  const [input2, setInput2] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult("");
    try {
      let res = "";
      if (mode === "summary") {
        res = await generateJobSummary(input);
      } else if (mode === "interview") {
        res = await generateInterviewPrep("Software Engineer", input, "Company");
      } else if (mode === "cover_letter") {
        res = await generateCoverLetter("Role", "Company", input, input2);
      } else if (mode === "follow_up") {
        res = await generateFollowUpEmail("Role", "Company", null, new Date().toLocaleDateString(), input);
      } else if (mode === "cv_suggestions") {
        res = await generateCVSuggestions(input, input2);
      }
      setResult(res);
    } catch {
      toast.error("AI generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  };

  const currentTool = aiTools.find((t) => t.id === mode);

  return (
    <AnimatePresence>
      {isAISidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAISidebarOpen(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-96 flex-col border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-semibold text-sm">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsAISidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {mode === "home" ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-4">
                    Select an AI tool to get started
                  </p>
                  {aiTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => { setMode(tool.id); setInput(""); setInput2(""); setResult(""); }}
                      className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-accent/50 transition-colors group"
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tool.bg}`}>
                        <tool.icon className={`h-4 w-4 ${tool.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{tool.label}</p>
                        <p className="text-xs text-muted-foreground">{tool.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => { setMode("home"); setResult(""); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to tools
                  </button>

                  <div className={`flex items-center gap-3 rounded-lg p-3 ${currentTool?.bg}`}>
                    {currentTool && (
                      <currentTool.icon className={`h-5 w-5 ${currentTool.color}`} />
                    )}
                    <div>
                      <p className="text-sm font-medium">{currentTool?.label}</p>
                      <p className="text-xs text-muted-foreground">{currentTool?.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {mode === "cover_letter" || mode === "cv_suggestions"
                          ? "Job Description"
                          : "Paste content here"}
                      </label>
                      <Textarea
                        placeholder={
                          mode === "summary"
                            ? "Paste the job description..."
                            : mode === "interview"
                            ? "Paste the job description..."
                            : mode === "cover_letter"
                            ? "Paste the job description..."
                            : mode === "follow_up"
                            ? "Context (interview date, who you spoke with...)"
                            : "Paste the job description..."
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={6}
                        className="text-xs"
                      />
                    </div>

                    {(mode === "cover_letter" || mode === "cv_suggestions") && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          {mode === "cover_letter" ? "Your CV highlights / skills" : "Your CV content"}
                        </label>
                        <Textarea
                          placeholder={mode === "cover_letter"
                            ? "Briefly describe your experience and key skills..."
                            : "Paste your CV text or key experience..."
                          }
                          value={input2}
                          onChange={(e) => setInput2(e.target.value)}
                          rows={4}
                          className="text-xs"
                        />
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleGenerate}
                      isLoading={isLoading}
                      disabled={!input.trim()}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                  </div>

                  {/* Result */}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating with Claude AI...
                    </div>
                  )}

                  {result && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Result</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={copyResult}>
                          Copy
                        </Button>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-thin">
                        {result}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
