"use client";

import { useMemo, useState } from "react";
import {
  Flame,
  Brain,
  Calendar,
  Info,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { calculateRecallHeatmap, HeatmapDay } from "@/lib/heatmap";

interface RecallActivityHeatmapProps {
  items: Array<{
    id?: string;
    title?: string;
    createdAt?: string | Date | null;
    lastReviewedAt?: string | Date | null;
    nextReviewAt?: string | Date | null;
    reviewBox?: number;
    reviewStatus?: string;
  }>;
  className?: string;
}

type RangeOption = "year" | "6m" | "3m";

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

// Fixed cell size & gap for mathematical alignment between month labels and columns
const CELL_SIZE_PX = 13;
const CELL_GAP_PX = 3;
const COLUMN_STEP_PX = CELL_SIZE_PX + CELL_GAP_PX; // 16px

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
  const [rangeMode, setRangeMode] = useState<RangeOption>("year");
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const numWeeks = rangeMode === "year" ? 52 : rangeMode === "6m" ? 26 : 12;

  const heatmap = useMemo(() => {
    return calculateRecallHeatmap(items, new Date(), numWeeks);
  }, [items, numWeeks]);

  // Leitner spaced-repetition retention stats
  const leitnerStats = useMemo(() => {
    const now = new Date();
    let dueCount = 0;
    const boxes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let masteredCount = 0;

    for (const item of items) {
      const box = Math.min(Math.max(item.reviewBox || 1, 1), 5) as 1 | 2 | 3 | 4 | 5;
      boxes[box] = (boxes[box] || 0) + 1;
      if (item.reviewStatus === "mastered" || box === 5) {
        masteredCount++;
      }
      if (item.nextReviewAt && new Date(item.nextReviewAt) <= now) {
        dueCount++;
      }
    }

    return {
      dueCount,
      boxes,
      masteredCount,
      total: items.length,
    };
  }, [items]);

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-[#0d0e12]/90 p-5 backdrop-blur-md shadow-xl ${className}`}
    >
      {/* Top Header: Title, Range Controls & Active Streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Recall & Review Activity</span>
            </h2>
            <p className="text-xs text-slate-400">
              {heatmap.totalActivities} {heatmap.totalActivities === 1 ? "activity" : "activities"} in the{" "}
              {rangeMode === "year" ? "past year" : rangeMode === "6m" ? "past 6 months" : "past 12 weeks"}
            </p>
          </div>
        </div>

        {/* Top Right: Range Selector (1 Year, 6 Months, 3 Months) & Streak Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Segmented Range Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setRangeMode("year")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                rangeMode === "year"
                  ? "bg-slate-800 text-white font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              1 Year
            </button>
            <button
              type="button"
              onClick={() => setRangeMode("6m")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                rangeMode === "6m"
                  ? "bg-slate-800 text-white font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setRangeMode("3m")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                rangeMode === "3m"
                  ? "bg-slate-800 text-white font-semibold shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              3 Months
            </button>
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

      {/* Mini Quick-Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Period Activity</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white tracking-tight">
            {heatmap.totalActivities}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {heatmap.activeDaysCount} active {heatmap.activeDaysCount === 1 ? "day" : "days"}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-300 tracking-tight">
            {heatmap.currentStreak} {heatmap.currentStreak === 1 ? "day" : "days"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Daily recall consistency
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Longest Streak</span>
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-lg font-bold text-white tracking-tight">
            {heatmap.longestStreak} {heatmap.longestStreak === 1 ? "day" : "days"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Personal all-time record
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium mb-1">
            <span>Due For Review</span>
            {leitnerStats.dueCount > 0 ? (
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div
            className={`text-lg font-bold tracking-tight ${
              leitnerStats.dueCount > 0 ? "text-amber-400" : "text-emerald-400"
            }`}
          >
            {leitnerStats.dueCount > 0 ? `${leitnerStats.dueCount} notes` : "All Done"}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {leitnerStats.masteredCount} of {leitnerStats.total} mastered
          </div>
        </div>
      </div>

      {/* Main Contribution Grid Area */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="inline-block min-w-full">
          {/* Month Labels Header (positioned with exact mathematical column offsets) */}
          <div className="flex items-start mb-2 select-none">
            <div className="w-8 shrink-0" />
            <div
              className="relative h-4 select-none"
              style={{ width: `${heatmap.weeks.length * COLUMN_STEP_PX}px` }}
            >
              {heatmap.monthLabels.map((m, idx) => (
                <span
                  key={idx}
                  className="absolute text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap"
                  style={{
                    left: `${m.colIndex * COLUMN_STEP_PX}px`,
                  }}
                >
                  {m.month}
                </span>
              ))}
            </div>
          </div>

          {/* Weekday labels + Columns */}
          <div className="flex items-start">
            {/* Weekday Labels (Mon, Wed, Fri) */}
            <div className="flex flex-col gap-[3px] pr-2 pt-[1px] select-none w-8">
              {WEEKDAY_LABELS.map((dayLabel, idx) => (
                <div
                  key={idx}
                  className="h-[13px] text-[10px] text-slate-500 font-mono flex items-center justify-end leading-none"
                >
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Weekly Columns */}
            <div className="flex gap-[3px]">
              {heatmap.weeks.map((week, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px]">
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
                        className={`w-[13px] h-[13px] rounded-[2.5px] border transition-all cursor-pointer relative ${getCellColorClass(
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

      {/* Heatmap Footer: Live Hover Inspector + Leitner Distribution + Intensity Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-800/80 text-xs">
        {/* Left: Interactive Hover Date Inspector */}
        <div className="flex items-center gap-2 min-h-[22px]">
          {hoveredDay ? (
            <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong className="text-white">
                {hoveredDay.count} {hoveredDay.count === 1 ? "review/entry" : "reviews/entries"}
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
              <span>Hover over any square to inspect review & note activity</span>
            </span>
          )}
        </div>

        {/* Center: Leitner Boxes Mini Distribution */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono self-start lg:self-auto">
          <span className="text-slate-500 text-[10px]">Leitner Boxes:</span>
          <div className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
              title="Box 1: Daily review"
            >
              B1: <strong className="text-white">{leitnerStats.boxes[1]}</strong>
            </span>
            <span
              className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
              title="Box 2: 3-day interval"
            >
              B2: <strong className="text-white">{leitnerStats.boxes[2]}</strong>
            </span>
            <span
              className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
              title="Box 3: Weekly interval"
            >
              B3: <strong className="text-white">{leitnerStats.boxes[3]}</strong>
            </span>
            <span
              className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
              title="Box 4: Bi-weekly interval"
            >
              B4: <strong className="text-white">{leitnerStats.boxes[4]}</strong>
            </span>
            <span
              className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-[10px] text-emerald-400"
              title="Box 5: Mastered (Monthly)"
            >
              B5: <strong className="text-emerald-300">{leitnerStats.boxes[5]}</strong>
            </span>
          </div>
        </div>

        {/* Right: Less -> More Intensity Swatches Legend */}
        <div className="flex items-center gap-1.5 self-end lg:self-auto font-mono text-[10px] text-slate-500">
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
