"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Loader2, Copy, Check, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { SummaryOutput } from "@/lib/agent/prompts/summary";

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "daily_plan" | "weekly_standup";
}

export function AIPlannerModal({
  isOpen,
  onClose,
  defaultMode = "daily_plan",
}: AIPlannerModalProps) {
  const [mode, setMode] = useState<"daily_plan" | "weekly_standup">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  async function handleGenerate(targetMode: "daily_plan" | "weekly_standup" = mode) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/agent/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: targetMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    let textToCopy = result.markdownSummary;

    if (result.weeklyStandup && result.weeklyStandup.standupBullets.length > 0) {
      textToCopy = result.weeklyStandup.standupBullets.join("\n");
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Engineering Planner & Standup</h2>
            <p className="text-xs text-slate-400">
              Gemini synthesizes plans and standups from your personal tasks, bugs, and learnings.
            </p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-4 max-w-sm">
          <button
            type="button"
            onClick={() => {
              setMode("daily_plan");
              handleGenerate("daily_plan");
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
              mode === "daily_plan"
                ? "bg-primary text-white shadow-sm shadow-primary/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            What to work on today?
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("weekly_standup");
              handleGenerate("weekly_standup");
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer ${
              mode === "weekly_standup"
                ? "bg-primary text-white shadow-sm shadow-primary/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            What did I fix this week?
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs">Analyzing your workspace records with Gemini...</p>
            </div>
          ) : !result ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Ready to plan</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Click below to synthesize a daily prioritized focus list or an engineering standup summary.
              </p>
              <button
                type="button"
                onClick={() => handleGenerate(mode)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-md shadow-primary/20 transition cursor-pointer"
              >
                Generate with Gemini
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-slate-950/80">
              {/* Daily Plan View */}
              {result.dailyPlan && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white">
                    {result.dailyPlan.headline}
                  </h3>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider block">
                      Recommended Focus Items
                    </span>
                    {result.dailyPlan.focusItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-medium text-white flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-primary px-1.5 py-0.5 rounded bg-primary-subtle border border-primary/20">
                              {item.type}
                            </span>
                            <span>{item.title}</span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{item.rationale}</p>
                        </div>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>

                  {result.dailyPlan.quickWins.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-medium text-success uppercase tracking-wider block mb-1">
                        Quick Wins
                      </span>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                        {result.dailyPlan.quickWins.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.dailyPlan.reviewReminder && (
                    <div className="p-2.5 rounded-lg bg-success-subtle border border-success/20 text-xs text-success">
                      {result.dailyPlan.reviewReminder}
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Standup View */}
              {result.weeklyStandup && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-primary uppercase tracking-wider block mb-2">
                      Standup Bullets (Ready to copy)
                    </span>
                    <div className="p-3.5 rounded-lg bg-black/60 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {result.weeklyStandup.standupBullets.join("\n")}
                    </div>
                  </div>

                  {result.weeklyStandup.fixedDefectsSummary && (
                    <div className="text-xs text-slate-300">
                      <span className="font-semibold text-warning block mb-0.5">Fixed Defects:</span>
                      <p>{result.weeklyStandup.fixedDefectsSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-4">
          {result && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Bullets"}</span>
            </button>
          )}

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>

            {result && (
              <button
                type="button"
                onClick={() => handleGenerate(mode)}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium transition cursor-pointer shadow-sm shadow-primary/20"
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
