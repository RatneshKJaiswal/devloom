"use client";

import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

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

  // Find max value for proportional scaling
  const maxTotal = Math.max(...data.map((d) => d.totalOpen), 1);

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
            <span className="w-2.5 h-2.5 rounded-sm bg-danger" />
            <span className="text-slate-300">Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-warning" />
            <span className="text-slate-300">Due Soon</span>
          </div>
        </div>
      </div>

      <div
        className="space-y-3 pt-2"
        role="region"
        aria-label="Due tasks breakdown by project"
      >
        {data.map((item) => {
          const overduePct = (item.overdueCount / maxTotal) * 100;
          const dueSoonPct = (item.dueSoonCount / maxTotal) * 100;

          return (
            <div key={item.projectId || item.projectName} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate max-w-[200px] sm:max-w-[260px]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.projectColor }}
                  />
                  <span className="font-medium text-slate-200 truncate">
                    {item.projectName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  {item.overdueCount > 0 && (
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {item.overdueCount} overdue
                    </span>
                  )}
                  {item.dueSoonCount > 0 && (
                    <span className="text-amber-300 font-semibold">
                      {item.dueSoonCount} due soon
                    </span>
                  )}
                </div>
              </div>

              {/* Stacked Proportional Bar */}
              <div
                className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex"
                role="progressbar"
                aria-valuenow={item.totalOpen}
                aria-valuemin={0}
                aria-valuemax={maxTotal}
                aria-label={`${item.projectName}: ${item.overdueCount} overdue, ${item.dueSoonCount} due soon`}
              >
                {item.overdueCount > 0 && (
                  <div
                    className="h-full bg-danger transition-all duration-300"
                    style={{ width: `${overduePct}%` }}
                    title={`${item.overdueCount} overdue`}
                  />
                )}
                {item.dueSoonCount > 0 && (
                  <div
                    className="h-full bg-warning transition-all duration-300"
                    style={{ width: `${dueSoonPct}%` }}
                    title={`${item.dueSoonCount} due soon`}
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
