"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Brain,
  Trash2,
  Eye,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Loader2,
  HelpCircle,
  Pencil,
  Play,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Calendar,
  Layers,
} from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { EditLearningModal } from "@/components/edit-learning-modal";
import { MarkdownPreview, stripMarkdown } from "@/components/ui/markdown-preview";

const BOX_INFO: Record<number, { label: string; interval: string; color: string }> = {
  1: { label: "Box 1 • Daily", interval: "1d interval", color: "bg-sky-500/10 text-sky-400 border-sky-500/25" },
  2: { label: "Box 2 • 3 Days", interval: "3d interval", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" },
  3: { label: "Box 3 • Weekly", interval: "7d interval", color: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  4: { label: "Box 4 • Bi-weekly", interval: "14d interval", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  5: { label: "Box 5 • Mastered", interval: "30d interval", color: "bg-purple-500/10 text-purple-400 border-purple-500/25" },
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  new: { label: "New Note", badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  learning: { label: "In Practice", badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  learned: { label: "Retained", badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  mastered: { label: "Mastered", badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
};

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<any[]>([]);
  const [dueLearnings, setDueLearnings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLearning, setEditingLearning] = useState<any | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Review mode state
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // AI Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<{
    question: string;
    hints: string[];
    explanation: string;
    practicalScenario?: string;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [allRes, dueRes, projRes] = await Promise.all([
        fetch("/api/learnings"),
        fetch("/api/learnings/review"),
        fetch("/api/projects"),
      ]);

      if (allRes.ok) {
        const allData = await allRes.json();
        setLearnings(Array.isArray(allData) ? allData : []);
      }
      if (dueRes.ok) {
        const dueData = await dueRes.json();
        setDueLearnings(Array.isArray(dueData) ? dueData : []);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : []);
      }
    } catch (err) {
      console.error("Failed to load learnings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startReviewSession(items: any[], startIndex = 0) {
    if (!items || items.length === 0) return;
    setReviewQueue(items);
    setCurrentReviewIndex(startIndex);
    setIsAnswerRevealed(false);
    setQuizData(null);
    setShowHint(false);
    setIsReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLoadQuiz() {
    const item = reviewQueue[currentReviewIndex];
    if (!item) return;

    setQuizLoading(true);
    try {
      const res = await fetch("/api/agent/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningId: item.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuizData(data);
      }
    } catch (err) {
      console.error("Failed to generate AI quiz:", err);
    } finally {
      setQuizLoading(false);
    }
  }

  async function handleReviewResult(passed: boolean) {
    const currentItem = reviewQueue[currentReviewIndex];
    if (!currentItem) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/learnings/${currentItem.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passed }),
      });

      if (res.ok) {
        setIsAnswerRevealed(false);
        setQuizData(null);
        setShowHint(false);

        if (currentReviewIndex + 1 < reviewQueue.length) {
          setCurrentReviewIndex((prev) => prev + 1);
        } else {
          // Completed review queue
          setIsReviewing(false);
          setCurrentReviewIndex(0);
          setReviewQueue([]);
          await loadData();
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function deleteLearning(id: string) {
    if (!confirm("Are you sure you want to delete this learning note?")) return;
    try {
      const res = await fetch(`/api/learnings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLearnings((prev) => prev.filter((l) => l.id !== id));
        setDueLearnings((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete learning:", err);
    }
  }

  function toggleCardExpand(id: string) {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  const currentItem = reviewQueue[currentReviewIndex];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-emerald-400" />
            <span>Learnings & Spaced Review</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Resurface technical gotchas, design patterns, and CLI snippets with a 5-box Leitner review engine.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Learning</span>
        </button>
      </div>

      {/* Spaced Review Queue Banner */}
      {!isReviewing && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {dueLearnings.length > 0
                  ? `${dueLearnings.length} learning${dueLearnings.length > 1 ? "s" : ""} scheduled for review`
                  : "All notes up to date"}
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              {dueLearnings.length > 0
                ? "Revisiting insights at scheduled Leitner intervals cements them permanently in your memory."
                : "No notes are overdue right now. You can still practice any card instantly below or launch a recall session."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {dueLearnings.length > 0 ? (
              <button
                onClick={() => startReviewSession(dueLearnings)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                Start Scheduled Session ({dueLearnings.length})
              </button>
            ) : learnings.length > 0 ? (
              <button
                onClick={() => startReviewSession(learnings)}
                className="px-4 py-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Practice All Notes</span>
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Interactive Flashcard Review Runner */}
      {isReviewing && currentItem && (
        <div className="p-8 rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${BOX_INFO[currentItem.reviewBox]?.color || "text-emerald-400"}`}>
                {BOX_INFO[currentItem.reviewBox]?.label || `Box ${currentItem.reviewBox}`}
              </span>
              <span className="text-xs text-slate-400">
                Card {currentReviewIndex + 1} of {reviewQueue.length}
              </span>
            </div>

            <button
              onClick={() => {
                setIsReviewing(false);
                setQuizData(null);
                setReviewQueue([]);
              }}
              className="text-xs text-slate-400 hover:text-white transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              Exit Session
            </button>
          </div>

          {/* Flashcard Content */}
          <div className="space-y-4 py-2 min-h-[160px]">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                Concept / Topic
              </span>
              <h2 className="text-xl font-bold text-white">{currentItem.title}</h2>
            </div>

            {/* AI Active-Recall Quiz Section */}
            {quizData ? (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary-subtle space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Recall Challenge</span>
                </div>
                <p className="text-sm font-medium text-white">{quizData.question}</p>

                {quizData.hints.length > 0 && (
                  <div>
                    {!showHint ? (
                      <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Need a hint?</span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-300 italic p-2 rounded bg-black/40 border border-slate-800">
                        Hint: {quizData.hints[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={quizLoading}
                onClick={handleLoadQuiz}
                className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-2 transition cursor-pointer"
              >
                {quizLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
                <span>Generate Active-Recall Question</span>
              </button>
            )}

            {/* Answer & Explanation */}
            {isAnswerRevealed ? (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold block">
                  Knowledge / Content
                </span>
                <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
                  <MarkdownPreview content={currentItem.content} />
                </div>

                {quizData?.explanation && (
                  <div className="mt-3 p-3 rounded-lg bg-black/40 border border-slate-800 text-xs text-slate-300">
                    <span className="font-semibold text-primary block mb-1">AI Takeaway:</span>
                    {quizData.explanation}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(true)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Reveal Answer</span>
                </button>
              </div>
            )}
          </div>

          {/* Evaluation Controls */}
          {isAnswerRevealed && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleReviewResult(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Forgot (Reset to Box 1 • 1d)</span>
              </button>

              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleReviewResult(true)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Remembered (Advance Stage)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Complete Learning Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Knowledge Base ({learnings.length})
          </h2>
          <span className="text-xs text-slate-400">
            5-Stage Leitner retention engine
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : learnings.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No learnings recorded yet</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Whenever you encounter a tricky bug, architectural insight, or CLI command, record it here for automated spaced review.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer"
            >
              Add First Learning
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learnings.map((item) => {
              const isExpanded = !!expandedCards[item.id];
              const boxCfg = BOX_INFO[item.reviewBox] || BOX_INFO[1];
              const statusCfg = STATUS_CONFIG[item.reviewStatus] || STATUS_CONFIG.new;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition flex flex-col justify-between gap-4 relative group"
                >
                  <div className="space-y-2.5">
                    {/* Header Chips & Card Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${boxCfg.color}`}>
                          {boxCfg.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.badgeClass}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Instant practice button */}
                        <button
                          type="button"
                          onClick={() => startReviewSession([item])}
                          title="Practice this card now"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingLearning(item)}
                          title="Edit learning"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => deleteLearning(item.id)}
                          title="Delete learning"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h3
                      onClick={() => setEditingLearning(item)}
                      className="text-base font-semibold text-white hover:text-emerald-300 transition cursor-pointer"
                    >
                      {item.title}
                    </h3>

                    {/* Note Content (Expandable & Scrollable with Markdown) */}
                    <div>
                      {isExpanded ? (
                        <div className="max-h-80 overflow-y-auto p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200">
                          <MarkdownPreview content={item.content} />
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                          {stripMarkdown(item.content)}
                        </p>
                      )}

                      {(item.content.length > 80 || item.content.includes("\n") || item.content.includes("```")) && (
                        <button
                          type="button"
                          onClick={() => toggleCardExpand(item.id)}
                          className="mt-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? "Collapse Note" : "Read Full Note (Markdown)"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Next review: {new Date(item.nextReviewAt).toLocaleDateString()}</span>
                    </span>
                    {item.projectName && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" />
                        <span>{item.projectName}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Learning Dialog */}
      <QuickCaptureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
        defaultTab="learning"
        lockTab={true}
      />

      {/* Edit Learning Dialog */}
      <EditLearningModal
        isOpen={!!editingLearning}
        onClose={() => setEditingLearning(null)}
        learning={editingLearning}
        projects={projects}
        onSuccess={loadData}
      />
    </div>
  );
}
