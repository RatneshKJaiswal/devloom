"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Bug, Brain, Sparkles, ArrowRight, Plus, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { AIPlannerModal } from "@/components/agent/ai-planner-modal";

export default function DashboardPage() {
  const [counts, setCounts] = useState({
    tasks: 0,
    bugs: 0,
    dueLearnings: 0,
  });
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerMode, setPlannerMode] = useState<"daily_plan" | "weekly_standup">("daily_plan");

  async function loadCounts() {
    try {
      const [tasksRes, bugsRes, dueRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/bugs"),
        fetch("/api/learnings/review"),
      ]);

      const tasks = tasksRes.ok ? await tasksRes.json() : [];
      const bugs = bugsRes.ok ? await bugsRes.json() : [];
      const due = dueRes.ok ? await dueRes.json() : [];

      setCounts({
        tasks: Array.isArray(tasks) ? tasks.filter((t) => t.status !== "done").length : 0,
        bugs: Array.isArray(bugs) ? bugs.filter((b) => b.status !== "resolved" && b.status !== "closed").length : 0,
        dueLearnings: Array.isArray(due) ? due.length : 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  }

  useEffect(() => {
    loadCounts();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Engineering Workspace</h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of your active tasks, open bugs, and spaced-review knowledge queue.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setPlannerMode("daily_plan");
              setIsPlannerOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Daily Plan</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Capture</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/tasks"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-indigo-500/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Tasks</span>
            <CheckSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{counts.tasks}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
            <span>View task board</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/bugs"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-amber-500/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Bugs</span>
            <Bug className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{counts.bugs}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
            <span>Inspect defects</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/learnings"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-emerald-500/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Due for Review</span>
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-400">
            {counts.dueLearnings}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>{counts.dueLearnings > 0 ? "Start recall session" : "Review notes"}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Agent Quota</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">50 / 50</div>
          <div className="mt-2 text-[11px] text-slate-400">
            Resets daily at 00:00 UTC
          </div>
        </div>
      </div>

      {/* Due for review highlight */}
      {counts.dueLearnings > 0 && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Spaced Review Queue Ready
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              You have {counts.dueLearnings} learning{counts.dueLearnings > 1 ? "s" : ""} waiting for recall practice.
            </p>
          </div>
          <Link
            href="/learnings"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
          >
            Launch Review
          </Link>
        </div>
      )}

      {/* Standup helper banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Need to report your accomplishments?</span>
          </h3>
          <p className="text-xs text-slate-400">
            Generate an engineering standup summary of all bugs fixed and tasks completed this week with one click.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPlannerMode("weekly_standup");
            setIsPlannerOpen(true);
          }}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer shrink-0"
        >
          Generate Standup
        </button>
      </div>

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSuccess={loadCounts}
      />

      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        defaultMode={plannerMode}
      />
    </div>
  );
}
