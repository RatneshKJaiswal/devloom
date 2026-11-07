"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Copy, Check, Calendar, CheckCircle2, AlertCircle, Sparkles, Cpu } from "lucide-react";
import { AIIcon } from "@/components/icons/ai";
import { SummaryOutput } from "@/lib/agent/prompts/summary";

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "daily_plan" | "weekly_standup";
}

interface SummaryResponse extends SummaryOutput {
  isAiFallback?: boolean;
}

export function AIPlannerModal({
  isOpen,
  onClose,
  defaultMode = "daily_plan",
}: AIPlannerModalProps) {
  const [mode, setMode] = useState<"daily_plan" | "weekly_standup">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (!result && !loading) {
        handleGenerate(mode);
      }
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
      setError(err.message || "An error occurred while compiling workspace plan");
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
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#1a1b1f] shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary-subtle border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <AIIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Engineering Planner & Standup</h2>
            <p className="text-xs text-slate-400">
              Heuristic priority engine & AI synthesis across your personal tasks, bugs, and learnings.
            </p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex gap-2 p-1 rounded-xl bg-[#121316] border border-slate-800 mb-4 max-w-sm">
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

        {/* Engine Notice */}
        {result?.isAiFallback && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-300 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Computed deterministically using DevLoom priority heuristics (AI high-demand fallback).</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs">Evaluating workspace records and computing priorities...</p>
            </div>
          ) : !result ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#121316]/40">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">Ready to plan</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Synthesize a prioritized engineering focus list or standup summary from your workspace records.
              </p>
              <button
                type="button"
                onClick={() => handleGenerate(mode)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-md shadow-primary/20 transition cursor-pointer"
              >
                Synthesize Plan
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-[#121316]">
              {/* Daily Plan View */}
              {result.dailyPlan && (
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {result.dailyPlan.headline}
                  </h3>

                  <div className="space-y-2.5">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                      Prioritized Items ({result.dailyPlan.focusItems.length})
                    </span>
                    {result.dailyPlan.focusItems.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No open tasks or defects requiring urgent action today.</p>
                    ) : (
                      result.dailyPlan.focusItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-800 bg-[#1a1b1f] flex items-start justify-between gap-3 text-xs shadow-sm hover:border-slate-700 transition"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-semibold text-white flex items-center gap-2 flex-wrap">
                              {/* Unique Identifier */}
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-blue-300 border border-blue-500/30">
                                {item.itemId}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                                {item.type}
                              </span>
                              <span className="truncate">{item.title}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                              {item.rationale}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${
                              item.priority === "urgent"
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : item.priority === "high"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {result.dailyPlan.quickWins.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-success uppercase tracking-wider block mb-1.5">
                        Quick Wins & Secondary Tasks
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {result.dailyPlan.quickWins.map((w, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-mono text-[11px]">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.dailyPlan.reviewReminder && (
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{result.dailyPlan.reviewReminder}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Standup View */}
              {result.weeklyStandup && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">
                      Standup Bullets (Accomplishments with IDs)
                    </span>
                    <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                      {result.weeklyStandup.standupBullets.join("\n")}
                    </div>
                  </div>

                  {result.weeklyStandup.fixedDefectsSummary && (
                    <div className="p-3 rounded-xl border border-slate-800 bg-[#1a1b1f] text-xs text-slate-300 space-y-0.5">
                      <span className="font-semibold text-amber-400 block">Defects Resolved:</span>
                      <p>{result.weeklyStandup.fixedDefectsSummary}</p>
                    </div>
                  )}

                  {result.weeklyStandup.completedTasksSummary && (
                    <div className="p-3 rounded-xl border border-slate-800 bg-[#1a1b1f] text-xs text-slate-300 space-y-0.5">
                      <span className="font-semibold text-emerald-400 block">Tasks Completed:</span>
                      <p>{result.weeklyStandup.completedTasksSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-4 shrink-0">
          {result && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Bullets"}</span>
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
                Re-synthesize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
