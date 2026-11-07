"use client";

import { PieChart } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface StatusProjectItem {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  todo: number;
  inProgress: number;
  done: number;
  cancelled: number;
  total: number;
}

interface ProjectStatusChartProps {
  data: StatusProjectItem[];
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload as StatusProjectItem;
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur px-3 py-2 shadow-2xl text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150">
        <p className="font-semibold text-slate-200">{item.projectName}</p>
        <div className="space-y-0.5 text-[11px] font-mono">
          <p className="text-slate-400">Todo: {item.todo}</p>
          <p className="text-blue-400">In Progress: {item.inProgress}</p>
          <p className="text-emerald-400">Done: {item.done}</p>
          {item.cancelled > 0 && <p className="text-slate-500">Cancelled: {item.cancelled}</p>}
          <p className="text-slate-300 pt-0.5 border-t border-slate-800">Total: {item.total}</p>
        </div>
      </div>
    );
  }
  return null;
}

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-xs text-slate-400">No project task data available.</p>
      </div>
    );
  }

  const chartHeight = Math.max(data.length * 42, 160);

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            <span>Project Status Distribution</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Workload breakdown across todo, active, and completed states
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-slate-500" />
            <span className="text-slate-400">Todo</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-500" />
            <span className="text-slate-300">In Progress</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Done</span>
          </span>
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
              tick={{ fill: "#64748b" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(100, 116, 139, 0.12)", radius: 6 }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="todo" name="Todo" stackId="st" fill="#64748b" radius={[0, 0, 0, 0]} animationDuration={500} animationEasing="ease-out" />
            <Bar dataKey="inProgress" name="In Progress" stackId="st" fill="#3b82f6" radius={[0, 0, 0, 0]} animationDuration={500} animationEasing="ease-out" />
            <Bar dataKey="done" name="Done" stackId="st" fill="#10b981" radius={[0, 4, 4, 0]} animationDuration={500} animationEasing="ease-out" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
