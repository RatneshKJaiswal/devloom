"use client";

import { PieChart } from "lucide-react";

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

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 text-center flex flex-col items-center justify-center min-h-[200px]">
        <p className="text-xs text-slate-400">No project task data available.</p>
      </div>
    );
  }

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
            <span className="w-2 h-2 rounded-sm bg-slate-600" />
            <span className="text-slate-400">Todo</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-primary" />
            <span className="text-slate-300">In Progress</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-success" />
            <span className="text-slate-300">Done</span>
          </span>
        </div>
      </div>

      <div
        className="space-y-3 pt-1"
        role="region"
        aria-label="Status distribution by project"
      >
        {data.map((item) => {
          const total = item.total || 1;
          const todoPct = (item.todo / total) * 100;
          const inProgressPct = (item.inProgress / total) * 100;
          const donePct = (item.done / total) * 100;
          const cancelledPct = (item.cancelled / total) * 100;

          return (
            <div key={item.projectId || item.projectName} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200 truncate max-w-[200px]">
                  {item.projectName}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {item.done}/{item.total} done ({Math.round(donePct)}%)
                </span>
              </div>

              {/* Segmented bar */}
              <div
                className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex"
                role="progressbar"
                aria-valuenow={item.done}
                aria-valuemin={0}
                aria-valuemax={item.total}
                aria-label={`${item.projectName}: ${item.todo} todo, ${item.inProgress} in progress, ${item.done} done`}
              >
                {donePct > 0 && (
                  <div
                    className="h-full bg-success"
                    style={{ width: `${donePct}%` }}
                    title={`${item.done} done`}
                  />
                )}
                {inProgressPct > 0 && (
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${inProgressPct}%` }}
                    title={`${item.inProgress} in progress`}
                  />
                )}
                {todoPct > 0 && (
                  <div
                    className="h-full bg-slate-600"
                    style={{ width: `${todoPct}%` }}
                    title={`${item.todo} todo`}
                  />
                )}
                {cancelledPct > 0 && (
                  <div
                    className="h-full bg-slate-800"
                    style={{ width: `${cancelledPct}%` }}
                    title={`${item.cancelled} cancelled`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
