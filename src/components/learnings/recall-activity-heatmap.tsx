"use client";

import { useMemo, useState } from "react";
import { Flame, Brain, Calendar, Info } from "lucide-react";
import { calculateRecallHeatmap, HeatmapDay } from "@/lib/heatmap";

interface RecallActivityHeatmapProps {
  items: Array<{
    createdAt?: string | Date | null;
    lastReviewedAt?: string | Date | null;
  }>;
  className?: string;
}

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCellColorClass(day: HeatmapDay): string {
  if (day.isFuture) {
    return "bg-slate-900/40 border-slate-800/40 opacity-30 cursor-default";
  }
  if (day.count === 0) {
    return "bg-slate-900/90 border-slate-800/90 hover:border-slate-600";
  }
  if (day.count === 1) {
    return "bg-emerald-950 border-emerald-800/90 hover:border-emerald-600 text-emerald-400";
  }
  if (day.count <= 3) {
    return "bg-emerald-700 border-emerald-600 hover:border-emerald-400 text-emerald-200";
  }
  return "bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/20 hover:border-emerald-300 text-white";
}

export function RecallActivityHeatmap({ items, className = "" }: RecallActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const heatmap = useMemo(() => {
    return calculateRecallHeatmap(items);
  }, [items]);

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 backdrop-blur-sm shadow-sm ${className}`}
    >
      {/* Top Header: Title, Total reviews & Streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Recall & Review Activity</span>
            </h3>
            <p className="text-xs text-slate-400">
              {heatmap.totalActivities} {heatmap.totalActivities === 1 ? "activity" : "activities"} across the last 12 weeks
            </p>
          </div>
        </div>

        {/* Streaks & Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {heatmap.currentStreak > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
              <Flame className="w-3.5 h-3.5 fill-amber-400/30 text-amber-400" />
              <span>{heatmap.currentStreak} day streak</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
              <Calendar className="w-3.5 h-3.5" />
              <span>0 day streak</span>
            </div>
          )}

          {heatmap.longestStreak > 0 && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Longest: <strong className="text-slate-400 font-semibold">{heatmap.longestStreak}d</strong>
            </span>
          )}
        </div>
      </div>

      {/* Grid container with responsive horizontal scroll */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Month Labels Header */}
          <div className="flex text-[11px] text-slate-400 font-mono mb-1.5 pl-8">
            <div className="flex gap-1.5">
              {heatmap.weeks.map((_, colIdx) => {
                const month = heatmap.monthLabels.find((m) => m.colIndex === colIdx);
                return (
                  <div key={colIdx} className="w-3.5 sm:w-4 text-center">
                    {month ? (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {month.month}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekday labels + Columns */}
          <div className="flex items-start">
            {/* Weekday Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-1.5 pr-2 pt-0.5 select-none w-8">
              {WEEKDAY_LABELS.map((dayLabel, idx) => (
                <div
                  key={idx}
                  className="h-3.5 sm:h-4 text-[10px] text-slate-500 font-mono flex items-center justify-end leading-none"
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* 12 Columns */}
            <div className="flex gap-1.5">
              {heatmap.weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-1.5">
                  {week.map((day, rowIdx) => {
                    const tooltipText = day.isFuture
                      ? `${formatDisplayDate(day.dateStr)} (Upcoming)`
                      : `${day.count} ${
                          day.count === 1 ? "activity" : "activities"
                        } on ${formatDisplayDate(day.dateStr)}`;

                    return (
                      <div
                        key={rowIdx}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] border transition-all cursor-pointer relative group ${getCellColorClass(
                          day
                        )} ${day.isToday ? "ring-1 ring-emerald-400 ring-offset-1 ring-offset-slate-950" : ""}`}
                        title={tooltipText}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Footer: Hover summary / Info + Intensity Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 min-h-[20px]">
          {hoveredDay ? (
            <span className="text-slate-300 font-mono">
              <strong className="text-white">
                {hoveredDay.count} {hoveredDay.count === 1 ? "review/entry" : "reviews/entries"}
              </strong>{" "}
              on {formatDisplayDate(hoveredDay.dateStr)}
              {hoveredDay.isToday && " (Today)"}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Logs note creation and Leitner spaced-repetition reviews</span>
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-[10px] text-slate-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-slate-900 border border-slate-800" title="0 activities" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-950 border border-emerald-800" title="1 activity" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-700 border border-emerald-600" title="2-3 activities" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 border border-emerald-400" title="4+ activities" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
