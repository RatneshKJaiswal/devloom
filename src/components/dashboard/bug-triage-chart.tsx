"use client";

import { Bug, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

interface BugTriageData {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  total: number;
}

interface BugTriageChartProps {
  data: BugTriageData;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "#ef4444",
  High: "#f59e0b",
  Medium: "#3b82f6",
  Low: "#64748b",
};

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur px-3 py-2 shadow-2xl text-xs">
        <p className="font-semibold text-slate-200">{item.payload.priority} Priority</p>
        <p className="font-mono mt-0.5" style={{ color: item.payload.color }}>
          {item.value} {item.value === 1 ? "defect" : "defects"}
        </p>
      </div>
    );
  }
  return null;
}

export function BugTriageChart({ data }: BugTriageChartProps) {
  const total = data.total || 0;
  const activeBugs =
    (data.byStatus.open || 0) +
    (data.byStatus.confirmed || 0) +
    (data.byStatus.fixing || 0);

  if (total === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[220px]">
        <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
        <h4 className="text-sm font-semibold text-white">Zero bugs reported</h4>
        <p className="text-xs text-slate-400 mt-1">Your defect backlog is completely clean.</p>
      </div>
    );
  }

  const chartData = [
    { priority: "Urgent", count: data.byPriority.urgent || 0, color: PRIORITY_COLORS.Urgent },
    { priority: "High", count: data.byPriority.high || 0, color: PRIORITY_COLORS.High },
    { priority: "Medium", count: data.byPriority.medium || 0, color: PRIORITY_COLORS.Medium },
    { priority: "Low", count: data.byPriority.low || 0, color: PRIORITY_COLORS.Low },
  ];

  const statusItems = [
    { key: "open", label: "Open", count: data.byStatus.open || 0, color: "text-red-400" },
    { key: "confirmed", label: "Confirmed", count: data.byStatus.confirmed || 0, color: "text-amber-400" },
    { key: "fixing", label: "Fixing", count: data.byStatus.fixing || 0, color: "text-blue-400" },
    { key: "resolved", label: "Resolved", count: data.byStatus.resolved || 0, color: "text-emerald-400" },
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
          <span className="font-semibold text-white font-mono">{activeBugs}</span>
          <span className="text-slate-400">active</span>
        </div>
      </div>

      {/* Priority Severity Bar Chart */}
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="priority"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.priority} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lifecycle Status Metrics */}
      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs">
        {statusItems.map((s) => (
          <div key={s.key} className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className={`font-mono font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
