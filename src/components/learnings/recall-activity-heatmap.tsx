"use client";

import { useMemo, useState } from "react";
import {
  Flame,
  Calendar,
  Info,
  Trophy,
  Activity,
} from "lucide-react";
import { HeatmapGridIcon } from "@/components/icons/heatmap-grid";
import { calculateRecallHeatmap, HeatmapDay } from "@/lib/heatmap";

interface RecallActivityHeatmapProps {
  items: Array<{
    id?: string;
    title?: string;
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
    return "bg-slate-900/30 border-slate-800/40 opacity-25 cursor-default";
  }
  if (day.count === 0) {
    return "bg-[#13151b] border-[#1e222b] hover:border-slate-500";
  }
  if (day.count === 1) {
    return "bg-emerald-950 border-emerald-800/90 hover:border-emerald-500 text-emerald-400";
  }
  if (day.count <= 3) {
    return "bg-emerald-700 border-emerald-600 hover:border-emerald-400 text-emerald-200";
  }
  return "bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.35)] hover:border-emerald-300 text-white";
}

export function RecallActivityHeatmap({ items, className = "" }: RecallActivityHeatmapProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2],
    [currentYear]
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const heatmap = useMemo(() => {
    return calculateRecallHeatmap(items, selectedYear);
  }, [items, selectedYear]);

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-[#0d0e12]/90 p-5 backdrop-blur-md shadow-xl ${className}`}
    >
      {/* Top Header: Title, Year Timeline Selector (current, current-1, current-2) & Streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
            <HeatmapGridIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Activity Heatmap</span>
            </h2>
            <p className="text-xs text-slate-400">
              {heatmap.totalActivities} {heatmap.totalActivities === 1 ? "activity" : "activities"} in {selectedYear}
            </p>
          </div>
        </div>

        {/* Top Right: Year Selector (current, current-1, current-2) & Streak Badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Year Timeline Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium">
            <span className="text-slate-500 text-[10px] px-2 font-mono hidden sm:inline">Year:</span>
            {yearOptions.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 rounded-md transition cursor-pointer font-mono ${
                  selectedYear === year
                    ? "bg-slate-800 text-white font-semibold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Active Streak Badge */}
          {heatmap.currentStreak > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs shadow-amber-500/10">
              <Flame className="w-3.5 h-3.5 fill-amber-400/30 text-amber-400" />
              <span>{heatmap.currentStreak}d streak</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>0d streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Mini Quick-Stats Strip (Clean 3-Card Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>{selectedYear} Activity</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {heatmap.totalActivities}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {heatmap.activeDaysCount} active {heatmap.activeDaysCount === 1 ? "day" : "days"} logged
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 tracking-tight">
            {heatmap.currentStreak} {heatmap.currentStreak === 1 ? "day" : "days"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {selectedYear === currentYear ? "Daily activity consistency" : `Completed in ${selectedYear}`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Longest Streak</span>
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {heatmap.longestStreak} {heatmap.longestStreak === 1 ? "day" : "days"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Best record in {selectedYear}
          </div>
        </div>
      </div>

      {/* Main Contribution Grid Area - Spans 100% Horizontal Space */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="w-full min-w-[720px]">
          {/* Month Labels Header (flex-1 matching column grid perfectly) */}
          <div className="flex items-start mb-2 select-none">
            <div className="w-8 shrink-0" />
            <div className="flex w-full gap-[2px] sm:gap-[3px]">
              {heatmap.weeks.map((_, colIdx) => {
                const month = heatmap.monthLabels.find((m) => m.colIndex === colIdx);
                return (
                  <div key={colIdx} className="flex-1 min-w-0 relative h-4">
                    {month && (
                      <span className="absolute left-0 top-0 text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap">
                        {month.month}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekday labels + Full-Width Columns */}
          <div className="flex items-stretch">
            {/* Weekday Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-[2px] sm:gap-[3px] pr-2 select-none w-8 shrink-0">
              {WEEKDAY_LABELS.map((dayLabel, idx) => (
                <div
                  key={idx}
                  className="flex-1 text-[10px] text-slate-500 font-mono flex items-center justify-end leading-none"
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Weekly Columns (w-full flex-1 covering entire space horizontally) */}
            <div className="flex w-full gap-[2px] sm:gap-[3px]">
              {heatmap.weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex-1 min-w-0 flex flex-col gap-[2px] sm:gap-[3px]">
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
                        className={`w-full aspect-square rounded-[2px] border transition-all cursor-pointer relative ${getCellColorClass(
                          day
                        )} ${
                          day.isToday
                            ? "ring-1.5 ring-emerald-400 ring-offset-1 ring-offset-[#0d0e12]"
                            : ""
                        }`}
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

      {/* Heatmap Footer: Live Hover Inspector + Intensity Legend (Clean, No Due-For-Review) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-800/80 text-xs">
        {/* Left: Interactive Hover Date Inspector */}
        <div className="flex items-center gap-2 min-h-[22px]">
          {hoveredDay ? (
            <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong className="text-white">
                {hoveredDay.count} {hoveredDay.count === 1 ? "activity" : "activities"}
              </strong>{" "}
              on {formatDisplayDate(hoveredDay.dateStr)}
              {hoveredDay.isToday && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Today
                </span>
              )}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Hover over any square to inspect activity breakdown</span>
            </span>
          )}
        </div>

        {/* Right: Less -> More Intensity Swatches Legend */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto font-mono text-[10px] text-slate-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-[2px] bg-[#13151b] border border-[#1e222b]" title="0 activities" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-950 border border-emerald-800" title="1 activity" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-700 border border-emerald-600" title="2-3 activities" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 border border-emerald-400" title="4+ activities" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
