"use client";

import { TrendingUp } from "lucide-react";

interface VelocityItem {
  weekLabel: string;
  completedTasks: number;
}

interface VelocityChartProps {
  data: VelocityItem[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  const items = data || [];
  const maxCompleted = Math.max(...items.map((i) => i.completedTasks), 1);
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
          <span className="text-base font-bold text-white font-mono">{totalCompleted}</span>
          <span className="text-xs text-slate-400 ml-1">total done</span>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="pt-2">
        <svg
          viewBox="0 0 280 80"
          className="w-full h-20 overflow-visible"
          role="img"
          aria-label={`Weekly completed tasks: ${items.map((i) => `${i.weekLabel}: ${i.completedTasks}`).join(", ")}`}
        >
          {items.map((item, idx) => {
            const barWidth = 36;
            const gap = (280 - items.length * barWidth) / (items.length + 1);
            const x = gap + idx * (barWidth + gap);
            const height = Math.max((item.completedTasks / maxCompleted) * 55, 4);
            const y = 65 - height;

            return (
              <g key={item.weekLabel} className="group cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={4}
                  className="fill-success transition-all duration-200 group-hover:opacity-80"
                />
                {/* Count on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-slate-300 text-[10px] font-mono font-semibold"
                >
                  {item.completedTasks}
                </text>
                {/* Week Label */}
                <text
                  x={x + barWidth / 2}
                  y={77}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px]"
                >
                  {item.weekLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
