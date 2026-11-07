"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Flag,
  CheckSquare,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Info,
} from "lucide-react";
import { TASK_STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/tokens";

interface ProjectTimelineProps {
  project: {
    id: string;
    name: string;
    color: string;
    startDate?: string | null;
    targetDate?: string | null;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    startDate?: string | null;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    targetDate: string;
    isCompleted: boolean;
  }>;
}

export function ProjectTimelineView({
  project,
  tasks = [],
  milestones = [],
}: ProjectTimelineProps) {
  const [resolution, setResolution] = useState<"day" | "week">("day");

  // Filter tasks into scheduled vs unscheduled
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: typeof tasks = [];
    const unscheduled: typeof tasks = [];

    for (const t of tasks) {
      if (t.dueDate || t.startDate) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    }
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks]);

  // Compute timeline date envelope
  const { startDate, endDate, totalDays, datesList } = useMemo(() => {
    const allDateStamps: number[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    allDateStamps.push(today.getTime());

    if (project.startDate) {
      allDateStamps.push(new Date(project.startDate).getTime());
    }
    if (project.targetDate) {
      allDateStamps.push(new Date(project.targetDate).getTime());
    }

    for (const m of milestones) {
      if (m.targetDate) {
        allDateStamps.push(new Date(m.targetDate).getTime());
      }
    }

    for (const t of scheduledTasks) {
      if (t.startDate) allDateStamps.push(new Date(t.startDate).getTime());
      if (t.dueDate) allDateStamps.push(new Date(t.dueDate).getTime());
    }

    const minStamp = Math.min(...allDateStamps);
    const maxStamp = Math.max(...allDateStamps);

    // Add padding days around bounds
    const padBefore = resolution === "day" ? 5 : 14;
    const padAfter = resolution === "day" ? 14 : 28;

    const start = new Date(minStamp - padBefore * 86400000);
    const end = new Date(maxStamp + padAfter * 86400000);

    const daysCount = Math.max(
      Math.round((end.getTime() - start.getTime()) / 86400000),
      14
    );

    const dates: Date[] = [];
    for (let i = 0; i < daysCount; i++) {
      dates.push(new Date(start.getTime() + i * 86400000));
    }

    return {
      startDate: start,
      endDate: end,
      totalDays: daysCount,
      datesList: dates,
    };
  }, [project, milestones, scheduledTasks, resolution]);

  const cellWidth = resolution === "day" ? 36 : 14;
  const timelineWidth = totalDays * cellWidth;

  // Helper to convert date to pixel X offset
  function dateToX(dateStr: string | Date): number {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffDays = (d.getTime() - startDate.getTime()) / 86400000;
    return Math.max(0, diffDays * cellWidth);
  }

  const todayX = dateToX(new Date());

  return (
    <div className="space-y-4">
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-white">Project Timeline</span>
          <span className="text-[11px] text-slate-400">
            ({scheduledTasks.length} dated tasks, {milestones.length} milestones)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Day / Week Resolution Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-800 bg-slate-900 text-[11px]">
            <button
              type="button"
              onClick={() => setResolution("day")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                resolution === "day"
                  ? "bg-primary text-white font-medium"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setResolution("week")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                resolution === "week"
                  ? "bg-primary text-white font-medium"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Canvas Container with Horizontal Scroll */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <div style={{ width: `${timelineWidth}px` }} className="relative select-none">
            {/* Header: Date Columns */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 sticky top-0 z-20 h-10">
              {datesList.map((d, idx) => {
                const isSunday = d.getDay() === 0;
                const isMonday = d.getDay() === 1;
                const isFirstOfMonth = d.getDate() === 1;
                const isToday =
                  d.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    style={{ width: `${cellWidth}px` }}
                    className={`shrink-0 flex flex-col justify-center items-center text-[10px] border-r border-slate-800/40 ${
                      isToday
                        ? "bg-primary-subtle text-primary font-bold"
                        : isSunday
                        ? "bg-slate-900/40 text-slate-500"
                        : "text-slate-400"
                    }`}
                    title={d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  >
                    {resolution === "day" ? (
                      <>
                        <span className="text-[9px] uppercase opacity-75">
                          {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                        </span>
                        <span className="font-mono">{d.getDate()}</span>
                      </>
                    ) : isMonday || isFirstOfMonth ? (
                      <span className="font-mono text-[9px] truncate">
                        {d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Vertical Guide Lines + Canvas Body */}
            <div className="relative min-h-[300px] py-4">
              {/* Today Guideline */}
              <div
                style={{ left: `${todayX + cellWidth / 2}px` }}
                className="absolute top-0 bottom-0 w-[2px] bg-primary z-10 pointer-events-none"
              >
                <div className="sticky top-1 -ml-6 px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-bold tracking-wider uppercase font-mono shadow-md">
                  Today
                </div>
              </div>

              {/* Background vertical day lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {datesList.map((d, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${cellWidth}px` }}
                    className="shrink-0 border-r border-slate-900/60 h-full"
                  />
                ))}
              </div>

              <div className="space-y-4 relative z-10 px-2">
                {/* 1. Project Duration Envelope */}
                {project.startDate && project.targetDate && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">
                      Project Horizon
                    </div>
                    <div className="relative h-7 flex items-center">
                      {(() => {
                        const startX = dateToX(project.startDate);
                        const endX = dateToX(project.targetDate) + cellWidth;
                        const width = Math.max(endX - startX, 24);

                        return (
                          <div
                            style={{ left: `${startX}px`, width: `${width}px` }}
                            className="absolute h-5 rounded-md border border-primary/50 bg-primary/20 flex items-center px-2 text-xs text-white font-medium truncate"
                            title={`Project: ${project.name} (${project.startDate} to ${project.targetDate})`}
                          >
                            <span className="truncate">{project.name}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 2. Milestones Row */}
                {milestones.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 pl-1 flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      <span>Milestones</span>
                    </div>

                    <div className="relative h-8 flex items-center">
                      {milestones.map((m) => {
                        const x = dateToX(m.targetDate) + cellWidth / 2;

                        return (
                          <div
                            key={m.id}
                            style={{ left: `${x}px` }}
                            className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                            title={`${m.title} (${m.targetDate}) - ${m.isCompleted ? "Completed" : "Pending"}`}
                          >
                            {/* Diamond pin marker */}
                            <div
                              className={`w-3.5 h-3.5 rotate-45 border shadow-sm transition-transform group-hover:scale-125 ${
                                m.isCompleted
                                  ? "bg-success border-success-foreground"
                                  : "bg-warning border-amber-600 animate-pulse"
                              }`}
                            />
                            <span className="text-[10px] font-semibold text-slate-200 mt-1 whitespace-nowrap bg-slate-900/90 px-1 rounded border border-slate-800">
                              {m.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Scheduled Tasks Bars */}
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-primary" />
                    <span>Dated Tasks</span>
                  </div>

                  {scheduledTasks.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 italic">
                      No tasks have dates assigned yet. Tasks with due dates will appear as bars here.
                    </div>
                  ) : (
                    scheduledTasks.map((t) => {
                      const taskStart = t.startDate || t.dueDate!;
                      const taskEnd = t.dueDate || t.startDate!;

                      const startX = dateToX(taskStart);
                      const endX = dateToX(taskEnd) + cellWidth;
                      const width = Math.max(endX - startX, 28);
                      const isSingleDay = !t.startDate || t.startDate === t.dueDate;

                      const isDone = t.status === "done";
                      const priorityColor =
                        PRIORITY_CONFIG[t.priority]?.badgeClass || "border-slate-700 text-slate-300";

                      return (
                        <div key={t.id} className="relative h-7 flex items-center group">
                          <div
                            style={{ left: `${startX}px`, width: `${width}px` }}
                            className={`absolute h-6 rounded-md border text-xs px-2 flex items-center justify-between gap-1 transition-all shadow-sm ${
                              isDone
                                ? "bg-slate-900/80 border-slate-700 text-slate-500 line-through"
                                : "bg-primary/20 border-primary/50 text-white hover:border-primary hover:bg-primary/30"
                            }`}
                            title={`${t.title} (${taskStart}${t.dueDate ? ` to ${t.dueDate}` : ""})`}
                          >
                            <span className="truncate font-medium text-[11px]">{t.title}</span>

                            <span
                              className={`text-[8px] uppercase font-bold px-1 py-0.2 rounded border shrink-0 ${priorityColor}`}
                            >
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unscheduled Tasks Tray */}
      {unscheduledTasks.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Unscheduled Tasks ({unscheduledTasks.length})</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Tasks without due dates are retained safely
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {unscheduledTasks.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-slate-300 truncate font-medium">{t.title}</span>
                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    PRIORITY_CONFIG[t.priority]?.badgeClass || "border-slate-700 text-slate-400"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
