"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Bug, Code2, Cpu, ArrowRight, Plus, FileText, Loader2 } from "lucide-react";
import { AIIcon } from "@/components/icons/ai";
import Link from "next/link";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { AIPlannerModal } from "@/components/agent/ai-planner-modal";
import { ReleaseNotesModal } from "@/components/dashboard/release-notes-modal";
import { DueTasksByProjectChart } from "@/components/dashboard/due-tasks-by-project-chart";
import { ProjectStatusChart } from "@/components/dashboard/project-status-chart";
import { BugTriageChart } from "@/components/dashboard/bug-triage-chart";
import { VelocityChart } from "@/components/dashboard/velocity-chart";
import type { DashboardAnalytics } from "@/lib/dal/analytics";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [totalLearnings, setTotalLearnings] = useState(0);
  const [fallbackBugCount, setFallbackBugCount] = useState(0);
  const [fallbackTaskCount, setFallbackTaskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [plannerMode, setPlannerMode] = useState<"daily_plan" | "weekly_standup">("daily_plan");
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [analyticsRes, learningsRes, bugsRes, tasksRes] = await Promise.all([
        fetch("/api/dashboard/analytics"),
        fetch("/api/learnings"),
        fetch("/api/bugs"),
        fetch("/api/tasks"),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (learningsRes.ok) {
        const learningsData = await learningsRes.json();
        setTotalLearnings(Array.isArray(learningsData) ? learningsData.length : 0);
      }

      if (bugsRes.ok) {
        const bugsData = await bugsRes.json();
        if (Array.isArray(bugsData)) {
          setFallbackBugCount(
            bugsData.filter((b: any) => b.status !== "resolved" && b.status !== "closed").length
          );
        }
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (Array.isArray(tasksData)) {
          setFallbackTaskCount(
            tasksData.filter((t: any) => t.status !== "done" && t.status !== "cancelled").length
          );
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const handleAgentUsage = () => {
      loadDashboard();
    };

    window.addEventListener("devloom-agent-usage", handleAgentUsage);
    return () => {
      window.removeEventListener("devloom-agent-usage", handleAgentUsage);
    };
  }, []);

  const totalActiveTasks =
    analytics?.totalActiveTasks ?? fallbackTaskCount;

  const totalOpenBugs =
    analytics?.bugsByStatusAndPriority.totalOpen ?? fallbackBugCount;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Engineering Workspace</h1>
          <p className="mt-1 text-sm text-slate-400">
            Overview of your active tasks, open bugs, and engineering knowledge base.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsReleaseNotesOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Draft release notes from completed tasks and resolved bugs"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Release Notes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPlannerMode("daily_plan");
              setIsPlannerOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary-subtle hover:bg-primary/20 text-primary text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <AIIcon className="w-3.5 h-3.5 text-primary" />
            <span>AI Daily Plan</span>
          </button>

          <button
            onClick={() => setIsQuickCaptureOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-primary/20 transition cursor-pointer"
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
            <Bug className="w-4 h-4 text-warning" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{totalOpenBugs}</div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-warning transition-colors">
            <span>Inspect defects</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <Link
          href="/learnings"
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-emerald-500/30 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Knowledge Base</span>
            <Code2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">
            {totalLearnings}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>Gotchas & snippets</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Agent Quota</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">
            {analytics?.agentQuota
              ? `${analytics.agentQuota.remainingRequests} / ${analytics.agentQuota.maxRequests}`
              : "50 / 50"}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {analytics?.agentQuota
              ? `${analytics.agentQuota.usedRequests} ops used today • Resets at 00:00 UTC`
              : "Resets daily at 00:00 UTC"}
          </div>
        </div>
      </div>

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

      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSuccess={loadDashboard}
      />

      <AIPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        defaultMode={plannerMode}
        onSuccess={loadDashboard}
      />

      <ReleaseNotesModal
        isOpen={isReleaseNotesOpen}
        onClose={() => setIsReleaseNotesOpen(false)}
      />
    </div>
  );
}
