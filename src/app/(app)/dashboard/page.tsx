"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Bug, Brain, Sparkles, ArrowRight, Plus, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { AIPlannerModal } from "@/components/agent/ai-planner-modal";
import { DueTasksByProjectChart } from "@/components/dashboard/due-tasks-by-project-chart";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { BugTriageChart } from "@/components/dashboard/bug-triage-chart";
import { VelocityChart } from "@/components/dashboard/velocity-chart";
import type { DashboardAnalytics } from "@/lib/dal/analytics";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [dueLearnings, setDueLearnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerMode, setPlannerMode] = useState<"daily_plan" | "weekly_standup">("daily_plan");

  async function loadDashboard() {
    setLoading(true);
    try {
      const [analyticsRes, dueRes] = await Promise.all([
        fetch("/api/dashboard/analytics"),
        fetch("/api/learnings/review"),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (dueRes.ok) {
        const dueData = await dueRes.json();
        setDueLearnings(Array.isArray(dueData) ? dueData.length : 0);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalActiveTasks =
    analytics?.statusDistributionByProject.reduce(
      (sum, p) => sum + p.todo + p.inProgress,
      0
    ) ?? 0;

  const totalOpenBugs =
    (analytics?.bugsByStatusAndPriority.byStatus.open ?? 0) +
    (analytics?.bugsByStatusAndPriority.byStatus.confirmed ?? 0) +
    (analytics?.bugsByStatusAndPriority.byStatus.fixing ?? 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
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
            className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary-subtle hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Daily Plan</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-primary/20 transition cursor-pointer"
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
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-primary/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Tasks</span>
            <CheckSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{totalActiveTasks}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-primary transition-colors">
            <span>View task board</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/bugs"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-warning/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Bugs</span>
            <Bug className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{totalOpenBugs}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-amber-400 transition-colors">
            <span>Inspect defects</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/learnings"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-success/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Due for Review</span>
            <Brain className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-400">
            {dueLearnings}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>{dueLearnings > 0 ? "Start recall session" : "Review notes"}</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Agent Quota</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">50 / 50</div>
          <div className="mt-2 text-[11px] text-slate-400">
            Resets daily at 00:00 UTC
          </div>
        </div>
      </div>

      {/* Due for review highlight */}
      {dueLearnings > 0 && (
        <div className="p-6 rounded-2xl border border-success/30 bg-success-subtle flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Spaced Review Queue Ready
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              You have {dueLearnings} learning{dueLearnings > 1 ? "s" : ""} waiting for recall practice.
            </p>
          </div>
          <Link
            href="/learnings"
            className="px-4 py-2 rounded-xl bg-success hover:bg-emerald-600 text-white text-xs font-medium shadow-md shadow-success/20 transition cursor-pointer shrink-0"
          >
            Launch Review
          </Link>
        </div>
      )}

      {/* Interactive Asana-Inspired Charts Grid */}
      {loading ? (
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DueTasksByProjectChart data={analytics?.dueTasksByProject || []} />
            <ProjectStatusChart data={analytics?.statusDistributionByProject || []} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BugTriageChart
              data={
                analytics?.bugsByStatusAndPriority || {
                  byStatus: {},
                  byPriority: {},
                  total: 0,
                }
              }
            />
            <VelocityChart data={analytics?.completedVelocity || []} />
          </div>
        </div>
      )}

      {/* Standup helper banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
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
        onSuccess={loadDashboard}
      />

      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        defaultMode={plannerMode}
      />
    </div>
  );
}
