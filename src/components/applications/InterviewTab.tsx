"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp,
  BookOpen, Target, Trophy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getInterviewRounds, createInterviewRound, updateInterviewRound, deleteInterviewRound,
  getInterviewQuestions, createInterviewQuestion, updateInterviewQuestion, deleteInterviewQuestion,
} from "@/lib/db/interviews";
import { updateApplication } from "@/lib/db/applications";
import { createClient } from "@/lib/supabase/client";
import type { InterviewRound, InterviewQuestion, InterviewResult, QuestionCategory } from "@/lib/types";
import toast from "react-hot-toast";

interface InterviewTabProps {
  applicationId: string;
  initialLessonsLearned: string | null;
}

const RESULT_CONFIG: Record<InterviewResult, { label: string; icon: string; className: string }> = {
  passed:   { label: "Passed",   icon: "✅", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  failed:   { label: "Failed",   icon: "❌", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  pending:  { label: "Pending",  icon: "⏳", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  rejected: { label: "Rejected", icon: "🚫", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const CATEGORY_CONFIG: Record<QuestionCategory, { label: string; className: string }> = {
  technical:  { label: "Technical",  className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  behavioral: { label: "Behavioral", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  company:    { label: "Company",    className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  role:       { label: "Role",       className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  general:    { label: "General",    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const emptyRoundForm = () => ({ round_name: "", result: "" as InterviewResult | "", interview_date: "", notes: "" });
const emptyQuestionForm = () => ({ question: "", answer: "", category: "general" as QuestionCategory });

export function InterviewTab({ applicationId, initialLessonsLearned }: InterviewTabProps) {
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState(initialLessonsLearned ?? "");
  const [lessonsSaved, setLessonsSaved] = useState(false);
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const [showRoundForm, setShowRoundForm] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [roundForm, setRoundForm] = useState(emptyRoundForm());

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<QuestionCategory | "all">("all");

  useEffect(() => {
    getInterviewRounds(applicationId)
      .then(setRounds)
      .catch(() => toast.error("Failed to load rounds"))
      .finally(() => setIsLoadingRounds(false));
    getInterviewQuestions(applicationId)
      .then(setQuestions)
      .catch(() => toast.error("Failed to load questions"))
      .finally(() => setIsLoadingQuestions(false));
  }, [applicationId]);

  // ── Round handlers ──────────────────────────────────────────────────────────

  const resetRoundForm = () => { setRoundForm(emptyRoundForm()); setShowRoundForm(false); setEditingRoundId(null); };

  const startEditRound = (round: InterviewRound) => {
    setRoundForm({
      round_name: round.round_name,
      result: round.result ?? "",
      interview_date: round.interview_date ?? "",
      notes: round.notes ?? "",
    });
    setEditingRoundId(round.id);
    setShowRoundForm(false);
  };

  const handleSaveRound = async () => {
    if (!roundForm.round_name.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const payload = {
        round_name: roundForm.round_name.trim(),
        result: (roundForm.result || null) as InterviewResult | null,
        interview_date: roundForm.interview_date || null,
        notes: roundForm.notes.trim() || null,
      };
      if (editingRoundId) {
        const updated = await updateInterviewRound(editingRoundId, payload);
        setRounds((prev) => prev.map((r) => r.id === editingRoundId ? updated : r));
        toast.success("Round updated");
      } else {
        const created = await createInterviewRound({ ...payload, application_id: applicationId, user_id: user.id });
        setRounds((prev) => [...prev, created]);
        toast.success("Round added");
      }
      resetRoundForm();
    } catch {
      toast.error("Failed to save round");
    }
  };

  const handleDeleteRound = async (id: string) => {
    if (!confirm("Delete this interview round?")) return;
    try {
      await deleteInterviewRound(id);
      setRounds((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ── Lessons Learned handler ──────────────────────────────────────────────────

  const handleSaveLessons = async () => {
    try {
      await updateApplication(applicationId, { lessons_learned: lessonsLearned.trim() || null });
      setLessonsSaved(true);
      setTimeout(() => setLessonsSaved(false), 2000);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  // ── Question handlers ───────────────────────────────────────────────────────

  const resetQuestionForm = () => { setQuestionForm(emptyQuestionForm()); setShowQuestionForm(false); setEditingQuestionId(null); };

  const startEditQuestion = (q: InterviewQuestion) => {
    setQuestionForm({ question: q.question, answer: q.answer ?? "", category: q.category });
    setEditingQuestionId(q.id);
    setShowQuestionForm(false);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const payload = {
        question: questionForm.question.trim(),
        answer: questionForm.answer.trim() || null,
        category: questionForm.category,
      };
      if (editingQuestionId) {
        const updated = await updateInterviewQuestion(editingQuestionId, payload);
        setQuestions((prev) => prev.map((q) => q.id === editingQuestionId ? updated : q));
        toast.success("Question updated");
      } else {
        const created = await createInterviewQuestion({ ...payload, application_id: applicationId, user_id: user.id });
        setQuestions((prev) => [...prev, created]);
        toast.success("Question added");
      }
      resetQuestionForm();
    } catch {
      toast.error("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await deleteInterviewQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleQuestion = (id: string) =>
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filteredQuestions = categoryFilter === "all" ? questions : questions.filter((q) => q.category === categoryFilter);

  // ── Shared form snippets ────────────────────────────────────────────────────

  const RoundForm = ({ onCancel }: { onCancel: () => void }) => (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Round name *</Label>
          <Input
            placeholder="HR Screen, Technical Round 1..."
            value={roundForm.round_name}
            onChange={(e) => setRoundForm((p) => ({ ...p, round_name: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={roundForm.interview_date}
            onChange={(e) => setRoundForm((p) => ({ ...p, interview_date: e.target.value }))}
            className="h-8 text-xs"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Result</Label>
        <Select
          value={roundForm.result ?? ""}
          onValueChange={(v) => setRoundForm((p) => ({ ...p, result: v as InterviewResult }))}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select result..." /></SelectTrigger>
          <SelectContent>
            {(Object.entries(RESULT_CONFIG) as [InterviewResult, typeof RESULT_CONFIG[InterviewResult]][]).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.icon} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="What happened in this round..."
          value={roundForm.notes}
          onChange={(e) => setRoundForm((p) => ({ ...p, notes: e.target.value }))}
          rows={2}
          className="text-xs resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-xs gap-1">
          <X className="h-3 w-3" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSaveRound} disabled={!roundForm.round_name.trim()} className="h-7 text-xs gap-1">
          <Save className="h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );

  const QuestionForm = ({ onCancel }: { onCancel: () => void }) => (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Question *</Label>
        <Textarea
          placeholder="Tell me about yourself..."
          value={questionForm.question}
          onChange={(e) => setQuestionForm((p) => ({ ...p, question: e.target.value }))}
          rows={2}
          className="text-xs resize-none"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Your prepared answer</Label>
        <Textarea
          placeholder="Write your answer here to practice..."
          value={questionForm.answer}
          onChange={(e) => setQuestionForm((p) => ({ ...p, answer: e.target.value }))}
          rows={4}
          className="text-xs resize-none"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Category</Label>
        <Select value={questionForm.category} onValueChange={(v) => setQuestionForm((p) => ({ ...p, category: v as QuestionCategory }))}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(CATEGORY_CONFIG) as [QuestionCategory, { label: string }][]).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} className="h-7 text-xs gap-1">
          <X className="h-3 w-3" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSaveQuestion} disabled={!questionForm.question.trim()} className="h-7 text-xs gap-1">
          <Save className="h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 mt-4">

      {/* ── 1. Interview Rounds ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Interview Rounds
          </h3>
          {!showRoundForm && !editingRoundId && (
            <Button variant="outline" size="sm" onClick={() => setShowRoundForm(true)} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Round
            </Button>
          )}
        </div>

        {showRoundForm && <RoundForm onCancel={resetRoundForm} />}

        {isLoadingRounds ? (
          <p className="text-xs text-muted-foreground py-2">Loading...</p>
        ) : rounds.length === 0 && !showRoundForm ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No interview rounds recorded yet.
          </p>
        ) : (
          <div className="space-y-2 mt-3">
            {rounds.map((round) =>
              editingRoundId === round.id ? (
                <RoundForm key={round.id} onCancel={resetRoundForm} />
              ) : (
                <div key={round.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-semibold">{round.round_name}</span>
                      {round.interview_date && (
                        <span className="text-xs text-muted-foreground">{round.interview_date}</span>
                      )}
                      {round.result && (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", RESULT_CONFIG[round.result].className)}>
                          {RESULT_CONFIG[round.result].icon} {RESULT_CONFIG[round.result].label}
                        </span>
                      )}
                    </div>
                    {round.notes && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{round.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEditRound(round)} className="p-1 rounded hover:bg-accent transition-colors">
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDeleteRound(round.id)} className="p-1 rounded hover:bg-accent transition-colors">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── 2. Lessons Learned ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-blue-500" />
          Lessons Learned
        </h3>
        <Textarea
          placeholder="What went well? What would you do differently? Key takeaways for future interviews..."
          value={lessonsLearned}
          onChange={(e) => setLessonsLearned(e.target.value)}
          rows={5}
          className="text-sm resize-none"
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={handleSaveLessons} className="h-7 text-xs gap-1">
            {lessonsSaved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
            {lessonsSaved ? "Saved!" : "Save"}
          </Button>
        </div>
      </div>

      {/* ── 3. Interview Q&A ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" />
            Interview Q&A
          </h3>
          {!showQuestionForm && !editingQuestionId && (
            <Button variant="outline" size="sm" onClick={() => setShowQuestionForm(true)} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Question
            </Button>
          )}
        </div>

        {/* Category filter pills */}
        {questions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(["all", "technical", "behavioral", "company", "role", "general"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {cat === "all" ? "All" : CATEGORY_CONFIG[cat].label}
                {cat !== "all" && (
                  <span className="ml-1 opacity-60">
                    ({questions.filter((q) => q.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {showQuestionForm && <div className="mb-4"><QuestionForm onCancel={resetQuestionForm} /></div>}

        {isLoadingQuestions ? (
          <p className="text-xs text-muted-foreground py-2">Loading...</p>
        ) : filteredQuestions.length === 0 && !showQuestionForm ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {questions.length === 0
              ? "No questions yet. Add questions to practice before your interview."
              : "No questions in this category."}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredQuestions.map((q) =>
              editingQuestionId === q.id ? (
                <QuestionForm key={q.id} onCancel={resetQuestionForm} />
              ) : (
                <div key={q.id} className="rounded-lg border border-border overflow-hidden">
                  <div
                    className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleQuestion(q.id)}
                  >
                    <span className={cn(
                      "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full mt-0.5",
                      CATEGORY_CONFIG[q.category]?.className ?? CATEGORY_CONFIG.general.className
                    )}>
                      {CATEGORY_CONFIG[q.category]?.label ?? "General"}
                    </span>
                    <span className="flex-1 text-xs font-medium leading-relaxed">{q.question}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEditQuestion(q); }}
                        className="p-1 rounded hover:bg-accent transition-colors"
                      >
                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                        className="p-1 rounded hover:bg-accent transition-colors"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                      {expandedQuestions.has(q.id)
                        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </div>
                  </div>
                  {expandedQuestions.has(q.id) && (
                    <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/10">
                      {q.answer ? (
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No answer written yet. Click edit to add one.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
