"use client";

import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface VelocityItem {
  weekLabel: string;
  completedTasks: number;
}

interface VelocityChartProps {
  data: VelocityItem[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur px-3 py-2 shadow-2xl text-xs animate-in fade-in zoom-in-95 duration-150">
        <p className="font-semibold text-slate-200">{label}</p>
        <p className="text-emerald-400 font-mono font-medium mt-0.5">
          {payload[0].value} {payload[0].value === 1 ? "task" : "tasks"} completed
        </p>
      </div>
    );
  }
  return null;
}

export function VelocityChart({ data }: VelocityChartProps) {
  const items = data || [];
  const totalCompleted = items.reduce((sum, i) => sum + i.completedTasks, 0);

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Completed Velocity</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tasks completed over the past 4 rolling weeks
          </p>
        </div>

        <div className="text-right">
          <span className="text-base font-bold text-emerald-400 font-mono">{totalCompleted}</span>
          <span className="text-xs text-slate-400 ml-1">total done</span>
        </div>
      </div>

      {/* Engineering Area Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={items} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="weekLabel"
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
            <Tooltip
              cursor={{ stroke: "#10b981", strokeWidth: 1.5, strokeDasharray: "3 3", strokeOpacity: 0.6 }}
              content={<CustomTooltip />}
            />
            <Area
              type="monotone"
              dataKey="completedTasks"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#velocityGradient)"
              animationDuration={600}
              animationEasing="ease-out"
              activeDot={{
                r: 6,
                fill: "#10b981",
                stroke: "#ffffff",
                strokeWidth: 2,
                className: "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
