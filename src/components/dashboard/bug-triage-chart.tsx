"use client";

import { Bug, AlertTriangle, ShieldCheck } from "lucide-react";

interface BugTriageData {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  total: number;
}

interface BugTriageChartProps {
  data: BugTriageData;
}

export function BugTriageChart({ data }: BugTriageChartProps) {
  const total = data.total || 0;
  const activeBugs =
    (data.byStatus.open || 0) +
    (data.byStatus.confirmed || 0) +
    (data.byStatus.fixing || 0);

  if (total === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[180px]">
        <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
        <h4 className="text-sm font-semibold text-white">Zero bugs reported</h4>
        <p className="text-xs text-slate-400 mt-1">Your defect backlog is completely clean.</p>
      </div>
    );
  }

  const priorityItems = [
    { key: "urgent", label: "Urgent", count: data.byPriority.urgent || 0, badge: "bg-danger-subtle text-red-300 border-danger/40" },
    { key: "high", label: "High", count: data.byPriority.high || 0, badge: "bg-warning-subtle text-amber-300 border-warning/40" },
    { key: "medium", label: "Medium", count: data.byPriority.medium || 0, badge: "bg-primary-subtle text-primary border-primary/30" },
    { key: "low", label: "Low", count: data.byPriority.low || 0, badge: "bg-slate-800/80 text-slate-400 border-slate-700" },
  ];

  const statusItems = [
    { key: "open", label: "Open", count: data.byStatus.open || 0 },
    { key: "confirmed", label: "Confirmed", count: data.byStatus.confirmed || 0 },
    { key: "fixing", label: "Fixing", count: data.byStatus.fixing || 0 },
    { key: "resolved", label: "Resolved", count: data.byStatus.resolved || 0 },
  ];

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bug className="w-4 h-4 text-amber-400" />
            <span>Bug Triage Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Defect severity breakdown and active lifecycle states
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">{activeBugs}</span>
          <span className="text-slate-400">active</span>
        </div>
      </div>

      {/* Priority Distribution Cards */}
      <div className="grid grid-cols-4 gap-2">
        {priorityItems.map((p) => (
          <div
            key={p.key}
            className={`p-2.5 rounded-xl border text-center ${p.badge}`}
          >
            <div className="text-base font-bold">{p.count}</div>
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">
              {p.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status Progress Pills */}
      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        {statusItems.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="font-mono font-medium text-slate-200">{s.count}</span>
            <span className="text-[11px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
