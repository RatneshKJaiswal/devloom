"use client";

import { Clock, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface DueProjectItem {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  overdueCount: number;
  dueSoonCount: number;
  totalOpen: number;
}

interface DueTasksByProjectChartProps {
  data: DueProjectItem[];
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as DueProjectItem;
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur px-3 py-2 shadow-2xl text-xs space-y-1">
        <p className="font-semibold text-slate-200">{item.projectName}</p>
        <div className="space-y-0.5 text-[11px] font-mono">
          <p className="text-red-400">Overdue: {item.overdueCount}</p>
          <p className="text-amber-400">Due Soon: {item.dueSoonCount}</p>
          <p className="text-slate-400">Total Open: {item.totalOpen}</p>
        </div>
      </div>
    );
  }
  return null;
}

export function DueTasksByProjectChart({ data }: DueTasksByProjectChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[220px]">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
        <h4 className="text-sm font-semibold text-white">All deadlines clear</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          No tasks are currently overdue or due in the next 7 days across your projects.
        </p>
      </div>
    );
  }

  // Dynamic height based on number of projects (min 160px)
  const chartHeight = Math.max(data.length * 42, 160);

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Due Tasks by Project</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Overdue and next-7-days deadlines requiring attention
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-slate-300">Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-slate-300">Due Soon</span>
          </div>
        </div>
      </div>

      {/* Horizontal Stacked Bar Chart */}
      <div style={{ height: chartHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="projectName"
              width={110}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#cbd5e1" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="overdueCount" name="Overdue" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
            <Bar dataKey="dueSoonCount" name="Due Soon" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
