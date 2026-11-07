"use client";

import { useState, useEffect } from "react";
import { Plus, Brain, Trash2, Eye, CheckCircle2, RotateCcw, Sparkles, Loader2, HelpCircle } from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<any[]>([]);
  const [dueLearnings, setDueLearnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Review mode state
  const [isReviewing, setIsReviewing] = useState(false);
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
      const [allRes, dueRes] = await Promise.all([
        fetch("/api/learnings"),
        fetch("/api/learnings/review"),
      ]);

      if (allRes.ok) {
        const allData = await allRes.json();
        setLearnings(allData);
      }
      if (dueRes.ok) {
        const dueData = await dueRes.json();
        setDueLearnings(dueData);
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

  async function handleLoadQuiz() {
    const item = dueLearnings[currentReviewIndex];
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
    const currentItem = dueLearnings[currentReviewIndex];
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

        if (currentReviewIndex + 1 < dueLearnings.length) {
          setCurrentReviewIndex((prev) => prev + 1);
        } else {
          // Completed review queue
          setIsReviewing(false);
          setCurrentReviewIndex(0);
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

  const currentItem = dueLearnings[currentReviewIndex];

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

      {/* Review Queue Banner */}
      {dueLearnings.length > 0 && !isReviewing && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                {dueLearnings.length} learning{dueLearnings.length > 1 ? "s" : ""} due for spaced review
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Revisiting insights before you forget cements them permanently in your memory.
            </p>
          </div>

          <button
            onClick={() => {
              setIsReviewing(true);
              setCurrentReviewIndex(0);
              setIsAnswerRevealed(false);
              setQuizData(null);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/30 transition cursor-pointer shrink-0"
          >
            Start Review Session
          </button>
        </div>
      )}

      {/* Interactive Flashcard Review Runner */}
      {isReviewing && currentItem && (
        <div className="p-8 rounded-2xl border border-emerald-500/40 bg-slate-900 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Box {currentItem.reviewBox} / 5
              </span>
              <span className="text-xs text-slate-400">
                Card {currentReviewIndex + 1} of {dueLearnings.length}
              </span>
            </div>

            <button
              onClick={() => {
                setIsReviewing(false);
                setQuizData(null);
              }}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Exit Session
            </button>
          </div>

          {/* Flashcard Content */}
          <div className="space-y-4 py-2 min-h-[160px]">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">
                Concept Topic
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
              !isAnswerRevealed && (
                <button
                  type="button"
                  disabled={quizLoading}
                  onClick={handleLoadQuiz}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary-subtle hover:bg-primary/20 text-primary text-xs font-medium transition cursor-pointer"
                >
                  {quizLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>{quizLoading ? "Generating Question..." : "Challenge Me with AI Quiz"}</span>
                </button>
              )
            )}

            {isAnswerRevealed ? (
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <span className="text-xs uppercase tracking-wider text-success block">
                  Knowledge / Content
                </span>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {currentItem.content}
                </p>

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
                <span>Forgot (Reset to Box 1 &bull; 1 day)</span>
              </button>

              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleReviewResult(true)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Remembered (Advance Box)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Complete Learning Library */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Knowledge Base ({learnings.length})</h2>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : learnings.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <Brain className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No learnings recorded yet</h3>
            <p className="mt-1 text-xs text-slate-400">
              Whenever you encounter a tricky bug or learn a CLI command, record it here for spaced review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learnings.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Box {item.reviewBox}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {item.reviewStatus}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteLearning(item.id)}
                      title="Delete learning"
                      className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Next review: {new Date(item.nextReviewAt).toLocaleDateString()}</span>
                  {item.projectName && <span className="text-primary">{item.projectName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickCaptureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
