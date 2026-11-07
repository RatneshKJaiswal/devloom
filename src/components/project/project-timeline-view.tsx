"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Flag,
  CheckSquare,
  Clock,
  Link2,
  Lock,
  RotateCcw,
  AlertCircle,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { TASK_STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/tokens";
import type { DependencyWithDetails } from "@/lib/dal/dependencies";
import { ProjectDependenciesModal } from "./project-dependencies-modal";

export function toDateStr(d: Date | string): string {
  if (typeof d === "string") {
    if (d.includes("T")) return d.split("T")[0];
    return d.slice(0, 10);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToStr(dateStr: string, days: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

interface DragState {
  taskId: string;
  mode: "move" | "resize-start" | "resize-due";
  startX: number;
  initialStart: string;
  initialDue: string;
  currentDeltaDays: number;
}

interface UndoAction {
  taskId: string;
  title: string;
  previousStart: string | null;
  previousDue: string | null;
  versionToUndo: number;
}

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
    version?: number;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    targetDate: string;
    isCompleted: boolean;
  }>;
  dependencies?: DependencyWithDetails[];
  onRefresh?: () => void;
}

export function ProjectTimelineView({
  project,
  tasks = [],
  milestones = [],
  dependencies = [],
  onRefresh,
}: ProjectTimelineProps) {
  const [resolution, setResolution] = useState<"day" | "week">("day");
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);

  // Local optimistic task state
  const [localTasks, setLocalTasks] = useState(tasks);
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Active drag state
  const [activeDrag, setActiveDrag] = useState<DragState | null>(null);

  // Floating notifications
  const [snapNotice, setSnapNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Auto-dismiss notices
  useEffect(() => {
    if (!snapNotice) return;
    const t = setTimeout(() => setSnapNotice(null), 5000);
    return () => clearTimeout(t);
  }, [snapNotice]);

  useEffect(() => {
    if (!errorNotice) return;
    const t = setTimeout(() => setErrorNotice(null), 6000);
    return () => clearTimeout(t);
  }, [errorNotice]);

  // Predecessor constraints lookup
  const getPredecessorConstraint = useCallback(
    (taskId: string): { earliestValidStart: string | null; blockerTitle: string | null } => {
      const predDeps = dependencies.filter((d) => d.successorId === taskId);
      let maxPredDateStr: string | null = null;
      let blocker: string | null = null;

      for (const dep of predDeps) {
        const predTask = localTasks.find((t) => t.id === dep.predecessorId);
        if (predTask) {
          const predEnd = predTask.dueDate || predTask.startDate;
          if (predEnd) {
            const predStr = toDateStr(predEnd);
            if (!maxPredDateStr || predStr > maxPredDateStr) {
              maxPredDateStr = predStr;
              blocker = predTask.title;
            }
          }
        }
      }

      return {
        earliestValidStart: maxPredDateStr ? addDaysToStr(maxPredDateStr, 1) : null,
        blockerTitle: blocker,
      };
    },
    [dependencies, localTasks]
  );

  // Filter tasks into scheduled vs unscheduled, with live drag overrides
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: typeof localTasks = [];
    const unscheduled: typeof localTasks = [];

    for (const t of localTasks) {
      if (activeDrag && activeDrag.taskId === t.id && activeDrag.currentDeltaDays !== 0) {
        const { mode, initialStart, initialDue, currentDeltaDays } = activeDrag;
        let newStart = initialStart;
        let newDue = initialDue;

        if (mode === "move") {
          newStart = addDaysToStr(initialStart, currentDeltaDays);
          newDue = addDaysToStr(initialDue, currentDeltaDays);
          const { earliestValidStart } = getPredecessorConstraint(t.id);
          if (earliestValidStart && newStart < earliestValidStart) {
            const diffDays = Math.round(
              (parseDateOnly(initialDue).getTime() - parseDateOnly(initialStart).getTime()) / 86400000
            );
            newStart = earliestValidStart;
            newDue = addDaysToStr(newStart, diffDays);
          }
        } else if (mode === "resize-start") {
          newStart = addDaysToStr(initialStart, currentDeltaDays);
          if (newStart > initialDue) newStart = initialDue;
          const { earliestValidStart } = getPredecessorConstraint(t.id);
          if (earliestValidStart && newStart < earliestValidStart) {
            newStart = earliestValidStart;
          }
        } else if (mode === "resize-due") {
          newDue = addDaysToStr(initialDue, currentDeltaDays);
          if (newDue < initialStart) newDue = initialStart;
        }

        scheduled.push({
          ...t,
          startDate: newStart,
          dueDate: newDue,
        });
      } else if (t.dueDate || t.startDate) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    }
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [localTasks, activeDrag, getPredecessorConstraint]);

  // Blocked status map
  const blockedMap = useMemo(() => {
    const map = new Map<string, { isBlocked: boolean; blockers: string[] }>();
    for (const dep of dependencies) {
      const entry = map.get(dep.successorId) || { isBlocked: false, blockers: [] };
      if (dep.predecessorStatus !== "done") {
        entry.isBlocked = true;
        entry.blockers.push(dep.predecessorTitle);
      }
      map.set(dep.successorId, entry);
    }
    return map;
  }, [dependencies]);

  // Compute timeline date envelope
  const { startDate, totalDays, datesList } = useMemo(() => {
    const allDateStamps: number[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    allDateStamps.push(today.getTime());

    if (project.startDate) {
      allDateStamps.push(parseDateOnly(project.startDate).getTime());
    }
    if (project.targetDate) {
      allDateStamps.push(parseDateOnly(project.targetDate).getTime());
    }

    for (const m of milestones) {
      if (m.targetDate) {
        allDateStamps.push(parseDateOnly(m.targetDate).getTime());
      }
    }

    for (const t of scheduledTasks) {
      if (t.startDate) allDateStamps.push(parseDateOnly(toDateStr(t.startDate)).getTime());
      if (t.dueDate) allDateStamps.push(parseDateOnly(toDateStr(t.dueDate)).getTime());
    }

    const minStamp = Math.min(...allDateStamps);
    const maxStamp = Math.max(...allDateStamps);

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

  function dateToX(dateVal: string | Date): number {
    const d = typeof dateVal === "string" ? parseDateOnly(toDateStr(dateVal)) : new Date(dateVal);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - startDate.getTime()) / 86400000);
    return Math.max(0, diffDays * cellWidth);
  }

  const todayX = dateToX(new Date());

  const taskRowHeight = 36;
  const tasksStartY = 110;

  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduledTasks.forEach((t, idx) => map.set(t.id, idx));
    return map;
  }, [scheduledTasks]);

  // Execute reschedule with optimistic locking & undo buffer
  async function executeReschedule(
    taskId: string,
    newStart: string | null,
    newDue: string | null,
    expectedVersion: number
  ) {
    const existing = localTasks.find((t) => t.id === taskId);
    if (!existing) return;

    const prevStart = existing.startDate ? toDateStr(existing.startDate) : null;
    const prevDue = existing.dueDate ? toDateStr(existing.dueDate) : null;

    // Optimistic state update
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, startDate: newStart, dueDate: newDue, version: expectedVersion + 1 }
          : t
      )
    );

    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: newStart,
          dueDate: newDue,
          expectedVersion,
        }),
      });

      if (res.status === 409) {
        // Optimistic concurrency collision
        setLocalTasks(tasks);
        setErrorNotice("Version conflict: Task was modified by another operation. Changes reverted.");
        if (onRefresh) onRefresh();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLocalTasks(tasks);
        setErrorNotice(data.error || "Failed to reschedule task.");
        return;
      }

      const updatedTask = await res.json();
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
      );

      // Set single-click undo action
      setUndoAction({
        taskId,
        title: existing.title,
        previousStart: prevStart,
        previousDue: prevDue,
        versionToUndo: updatedTask.version,
      });

      if (onRefresh) onRefresh();
    } catch (err: any) {
      setLocalTasks(tasks);
      setErrorNotice(err.message || "Network error while rescheduling.");
    } finally {
      setIsRescheduling(false);
    }
  }

  // Handle single-click undo
  async function handleUndo() {
    if (!undoAction) return;
    const action = undoAction;
    setUndoAction(null);

    await executeReschedule(
      action.taskId,
      action.previousStart,
      action.previousDue,
      action.versionToUndo
    );
  }

  // Pointer event handlers for drag / resize
  const handlePointerDown = (
    e: React.PointerEvent,
    task: (typeof scheduledTasks)[0],
    mode: "move" | "resize-start" | "resize-due"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const taskStart = toDateStr(task.startDate || task.dueDate!);
    const taskDue = toDateStr(task.dueDate || task.startDate!);

    setActiveDrag({
      taskId: task.id,
      mode,
      startX: e.clientX,
      initialStart: taskStart,
      initialDue: taskDue,
      currentDeltaDays: 0,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag) return;
    const diffPx = e.clientX - activeDrag.startX;
    const deltaDays = Math.round(diffPx / cellWidth);
    if (deltaDays !== activeDrag.currentDeltaDays) {
      setActiveDrag((prev) => (prev ? { ...prev, currentDeltaDays: deltaDays } : null));
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!activeDrag) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const { taskId, mode, initialStart, initialDue, currentDeltaDays } = activeDrag;
    setActiveDrag(null);

    if (currentDeltaDays === 0) return;

    let newStart = initialStart;
    let newDue = initialDue;
    let didSnap = false;

    const { earliestValidStart, blockerTitle } = getPredecessorConstraint(taskId);

    if (mode === "move") {
      newStart = addDaysToStr(initialStart, currentDeltaDays);
      newDue = addDaysToStr(initialDue, currentDeltaDays);

      if (earliestValidStart && newStart < earliestValidStart) {
        const diffDays = Math.round(
          (parseDateOnly(initialDue).getTime() - parseDateOnly(initialStart).getTime()) / 86400000
        );
        newStart = earliestValidStart;
        newDue = addDaysToStr(newStart, diffDays);
        didSnap = true;
      }
    } else if (mode === "resize-start") {
      newStart = addDaysToStr(initialStart, currentDeltaDays);
      if (newStart > initialDue) newStart = initialDue;
      if (earliestValidStart && newStart < earliestValidStart) {
        newStart = earliestValidStart;
        didSnap = true;
      }
    } else if (mode === "resize-due") {
      newDue = addDaysToStr(initialDue, currentDeltaDays);
      if (newDue < initialStart) newDue = initialStart;
    }

    if (didSnap && blockerTitle) {
      setSnapNotice(`Snapped to earliest valid start date (blocked by "${blockerTitle}")`);
    }

    const currentTask = localTasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    await executeReschedule(taskId, newStart, newDue, currentTask.version || 1);
  };

  // Keyboard navigation shortcuts (Alt + ArrowLeft/Right = 1d, Alt + Shift + Arrow = 7d)
  const handleKeyDown = async (
    e: React.KeyboardEvent,
    task: (typeof scheduledTasks)[0]
  ) => {
    if (!e.altKey) return;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = e.shiftKey ? -7 : -1;
    else if (e.key === "ArrowRight") delta = e.shiftKey ? 7 : 1;
    else return;

    e.preventDefault();

    const taskStart = toDateStr(task.startDate || task.dueDate!);
    const taskDue = toDateStr(task.dueDate || task.startDate!);

    let newStart = addDaysToStr(taskStart, delta);
    let newDue = addDaysToStr(taskDue, delta);

    const { earliestValidStart, blockerTitle } = getPredecessorConstraint(task.id);
    if (earliestValidStart && newStart < earliestValidStart) {
      const diffDays = Math.round(
        (parseDateOnly(taskDue).getTime() - parseDateOnly(taskStart).getTime()) / 86400000
      );
      newStart = earliestValidStart;
      newDue = addDaysToStr(newStart, diffDays);
      if (blockerTitle) {
        setSnapNotice(`Snapped to earliest valid start date (blocked by "${blockerTitle}")`);
      }
    }

    await executeReschedule(task.id, newStart, newDue, task.version || 1);
  };

  return (
    <div className="space-y-4 relative">
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-white">Project Timeline</span>
          <span className="text-[11px] text-slate-400">
            ({scheduledTasks.length} dated tasks, {milestones.length} milestones, {dependencies.length} dependencies)
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline ml-2 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900/60">
            Alt+←/→: shift 1d • Drag bar or handles
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Manage Dependencies Trigger */}
          <button
            type="button"
            onClick={() => setIsDepModalOpen(true)}
            className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-primary" />
            <span>Dependencies ({dependencies.length})</span>
          </button>

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
                const isToday = d.toDateString() === new Date().toDateString();

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
            <div className="relative min-h-[340px] py-4">
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

              {/* SVG Dependency Connector Curves Overlay */}
              <svg
                style={{ width: `${timelineWidth}px` }}
                className="absolute inset-0 h-full pointer-events-none z-10"
              >
                <defs>
                  <marker
                    id="arrow-resolved"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
                  </marker>
                  <marker
                    id="arrow-blocked"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#EA4335" />
                  </marker>
                </defs>

                {dependencies.map((dep) => {
                  const predIdx = taskIndexMap.get(dep.predecessorId);
                  const succIdx = taskIndexMap.get(dep.successorId);
                  if (predIdx === undefined || succIdx === undefined) return null;

                  const predTask = scheduledTasks[predIdx];
                  const succTask = scheduledTasks[succIdx];
                  if (!predTask || !succTask) return null;

                  const predEnd = predTask.dueDate || predTask.startDate!;
                  const succStart = succTask.startDate || succTask.dueDate!;

                  const x1 = dateToX(predEnd) + cellWidth;
                  const y1 = tasksStartY + predIdx * taskRowHeight + 14;

                  const x2 = dateToX(succStart);
                  const y2 = tasksStartY + succIdx * taskRowHeight + 14;

                  const isBlocked = dep.predecessorStatus !== "done";
                  const c1x = x1 + Math.max(Math.abs(x2 - x1) / 2, 20);
                  const c2x = x2 - Math.max(Math.abs(x2 - x1) / 2, 20);

                  const pathD = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;

                  return (
                    <path
                      key={dep.id}
                      d={pathD}
                      fill="none"
                      stroke={isBlocked ? "var(--timeline-dep-blocked)" : "var(--timeline-dep-line)"}
                      strokeWidth={isBlocked ? 2 : 1.5}
                      strokeDasharray={isBlocked ? "4 3" : undefined}
                      markerEnd={isBlocked ? "url(#arrow-blocked)" : "url(#arrow-resolved)"}
                      className="transition-all opacity-80 hover:opacity-100"
                    />
                  );
                })}
              </svg>

              <div className="space-y-4 relative z-10 px-2">
                {/* 1. Project Duration Envelope */}
                {project.startDate && project.targetDate && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">
                      Project Horizon
                    </div>

                    <div className="relative h-6 flex items-center">
                      {(() => {
                        const startX = dateToX(project.startDate);
                        const endX = dateToX(project.targetDate) + cellWidth;
                        const width = Math.max(endX - startX, cellWidth);

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

                {/* 3. Scheduled Tasks Bars with Gantt Drag Handles */}
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3 text-primary" />
                    <span>Dated Tasks (Interactive Gantt)</span>
                  </div>

                  {scheduledTasks.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 italic">
                      No tasks have dates assigned yet. Tasks with due dates will appear as bars here.
                    </div>
                  ) : (
                    scheduledTasks.map((t) => {
                      const taskStart = toDateStr(t.startDate || t.dueDate!);
                      const taskEnd = toDateStr(t.dueDate || t.startDate!);

                      const startX = dateToX(taskStart);
                      const endX = dateToX(taskEnd) + cellWidth;
                      const width = Math.max(endX - startX, 32);

                      const isDone = t.status === "done";
                      const blockedInfo = blockedMap.get(t.id);
                      const isBlocked = !isDone && !!blockedInfo?.isBlocked;
                      const isCurrentlyDragging = activeDrag?.taskId === t.id;

                      const priorityColor =
                        PRIORITY_CONFIG[t.priority]?.badgeClass || "border-slate-700 text-slate-300";

                      return (
                        <div key={t.id} className="relative h-7 flex items-center group">
                          {/* Task Bar with Handles & Drag Handlers */}
                          <div
                            tabIndex={0}
                            role="slider"
                            aria-label={`Task: ${t.title}. Start: ${taskStart}, Due: ${taskEnd}. Alt+Left/Right arrows to shift.`}
                            aria-valuenow={Math.round(startX / cellWidth)}
                            aria-valuemin={0}
                            aria-valuemax={totalDays}
                            aria-valuetext={`${taskStart} to ${taskEnd}`}
                            onKeyDown={(e) => handleKeyDown(e, t)}
                            style={{ left: `${startX}px`, width: `${width}px` }}
                            className={`absolute h-6 rounded-md border text-xs flex items-center justify-between gap-1 shadow-sm select-none cursor-grab active:cursor-grabbing outline-none focus:ring-2 focus:ring-primary/80 ${
                              isCurrentlyDragging
                                ? "ring-2 ring-primary bg-primary/40 border-primary z-30"
                                : isDone
                                ? "bg-slate-900/80 border-slate-700 text-slate-500 line-through"
                                : isBlocked
                                ? "bg-danger-subtle border-danger/60 text-white hover:border-danger"
                                : "bg-primary/20 border-primary/50 text-white hover:border-primary hover:bg-primary/30"
                            }`}
                            onPointerDown={(e) => handlePointerDown(e, t, "move")}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            title={`${t.title} (${taskStart} to ${taskEnd})${
                              isBlocked ? ` - BLOCKED by: ${blockedInfo?.blockers.join(", ")}` : ""
                            } • Drag bar or resize edges`}
                          >
                            {/* Left Handle: Resize Start Date */}
                            <div
                              role="button"
                              aria-label="Resize start date"
                              onPointerDown={(e) => handlePointerDown(e, t, "resize-start")}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/30 rounded-l flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                            >
                              <div className="w-[2px] h-3 bg-white/70 rounded-full" />
                            </div>

                            {/* Center Content */}
                            <div className="flex items-center gap-1.5 truncate px-2 pointer-events-none">
                              {isBlocked && (
                                <Lock className="w-3 h-3 text-red-400 shrink-0 animate-pulse" />
                              )}
                              <span className="truncate font-medium text-[11px]">{t.title}</span>
                            </div>

                            <span
                              className={`text-[8px] uppercase font-bold px-1 py-0.2 rounded border shrink-0 mr-1.5 pointer-events-none ${priorityColor}`}
                            >
                              {t.priority}
                            </span>

                            {/* Right Handle: Resize Due Date */}
                            <div
                              role="button"
                              aria-label="Resize due date"
                              onPointerDown={(e) => handlePointerDown(e, t, "resize-due")}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-white/30 rounded-r flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                            >
                              <div className="w-[2px] h-3 bg-white/70 rounded-full" />
                            </div>
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

      {/* Floating Notification / Undo Toast Bar */}
      {(snapNotice || errorNotice || undoAction) && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Dependency Snap Alert */}
          {snapNotice && (
            <div className="p-3 rounded-xl border border-warning/50 bg-amber-950/90 text-amber-200 text-xs shadow-xl flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                <span>{snapNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSnapNotice(null)}
                className="text-amber-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error Notice */}
          {errorNotice && (
            <div className="p-3 rounded-xl border border-danger/50 bg-red-950/90 text-red-200 text-xs shadow-xl flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <span>{errorNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorNotice(null)}
                className="text-red-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Undo Snackbar */}
          {undoAction && (
            <div className="p-3 rounded-xl border border-slate-700 bg-slate-900/95 text-white text-xs shadow-2xl flex items-center justify-between gap-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 truncate">
                <Check className="w-4 h-4 text-success shrink-0" />
                <span className="truncate">Rescheduled "{undoAction.title}"</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={isRescheduling}
                  className="px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white font-medium text-xs flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUndoAction(null)}
                  className="text-slate-400 hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Dependencies Modal */}
      <ProjectDependenciesModal
        isOpen={isDepModalOpen}
        onClose={() => setIsDepModalOpen(false)}
        projectId={project.id}
        tasks={localTasks}
        dependencies={dependencies}
        onRefresh={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
