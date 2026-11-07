"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Plus,
  FolderKanban,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TASK_STATUS_CONFIG, PRIORITY_CONFIG } from "@/lib/tokens";
import type { DependencyWithDetails } from "@/lib/dal/dependencies";
import { ProjectDependenciesModal } from "./project-dependencies-modal";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";

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
    task_number?: number | null;
    taskNumber?: number | null;
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
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const baseCellWidth = resolution === "day" ? 40 : 18;
  const cellWidth = Math.round(baseCellWidth * zoomScale);
  const timelineWidth = totalDays * cellWidth;

  // Month-Year groups for the sticky header
  const monthGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      label: string;
      year: number;
      daysCount: number;
      width: number;
    }> = [];

    for (const d of datesList) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key === key) {
        lastGroup.daysCount += 1;
        lastGroup.width += cellWidth;
      } else {
        groups.push({
          key,
          label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          year: d.getFullYear(),
          daysCount: 1,
          width: cellWidth,
        });
      }
    }
    return groups;
  }, [datesList, cellWidth]);

  function dateToX(dateVal: string | Date): number {
    const d = typeof dateVal === "string" ? parseDateOnly(toDateStr(dateVal)) : new Date(dateVal);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - startDate.getTime()) / 86400000);
    return Math.max(0, diffDays * cellWidth);
  }

  const todayX = dateToX(new Date());

  // Task layout measurements
  const taskRowHeight = 40; // 32px bar row + 8px gap
  const hasHorizon = !!(project.startDate && project.targetDate);
  const hasMilestones = milestones.length > 0;

  // Pixel-accurate Y calculation for SVG connector lines
  const computedTasksStartY = useMemo(() => {
    let y = 16; // py-4 canvas body padding
    if (hasHorizon) {
      y += 62; // Horizon section (label + bar + spacing)
    }
    if (hasMilestones) {
      y += 68; // Milestones section (label + diamonds + spacing)
    }
    y += 32; // Tasks section label & margin
    return y;
  }, [hasHorizon, hasMilestones]);

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

  // Scroll and Schedule Management
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedUnscheduledTaskId, setSelectedUnscheduledTaskId] = useState<string>("");
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(toDateStr(new Date()));
  const [scheduleDueDate, setScheduleDueDate] = useState<string>(addDaysToStr(toDateStr(new Date()), 2));
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.shiftKey) {
        scrollContainerRef.current.scrollLeft += e.deltaY * 0.75;
      }
    }
  };

  const scrollToToday = useCallback(() => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, todayX - containerWidth / 2 + cellWidth / 2),
        behavior: "smooth",
      });
    }
  }, [todayX, cellWidth]);

  const scrollByOffset = (offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      scrollToToday();
    }, 150);
    return () => clearTimeout(t);
  }, [scrollToToday]);

  function openScheduleDialog(taskId?: string) {
    if (taskId) {
      setSelectedUnscheduledTaskId(taskId);
      setScheduleStartDate(toDateStr(new Date()));
      setScheduleDueDate(addDaysToStr(toDateStr(new Date()), 2));
      setScheduleModalOpen(true);
    } else if (unscheduledTasks.length > 0) {
      setSelectedUnscheduledTaskId(unscheduledTasks[0].id);
      setScheduleStartDate(toDateStr(new Date()));
      setScheduleDueDate(addDaysToStr(toDateStr(new Date()), 2));
      setScheduleModalOpen(true);
    } else {
      setIsQuickCaptureOpen(true);
    }
  }

  async function handleScheduleConfirm() {
    if (!selectedUnscheduledTaskId) return;
    const targetTask = localTasks.find((t) => t.id === selectedUnscheduledTaskId);
    if (!targetTask) return;

    setScheduleModalOpen(false);
    await executeReschedule(
      targetTask.id,
      scheduleStartDate,
      scheduleDueDate,
      targetTask.version || 1
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
    <div
      className={
        isExpanded
          ? "fixed inset-0 z-50 bg-[#121316] p-4 sm:p-6 flex flex-col h-screen w-screen overflow-hidden space-y-4 shadow-2xl animate-in fade-in duration-200"
          : "space-y-4 relative"
      }
    >
      {/* Timeline Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-800 bg-[#1a1b1f] shadow-sm shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-primary-subtle text-primary border border-primary/25">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-tight">Timeline & Gantt</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-850 text-slate-300 border border-slate-700">
                {scheduledTasks.length} dated • {milestones.length} milestones
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Interactive SDLC timeline with dependencies, milestones, and drag scheduling.
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden lg:inline ml-1 px-2 py-0.5 rounded border border-slate-800 bg-slate-900">
            Alt+←/→: shift 1d • Drag edge handles to resize
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom In / Zoom Out Controls */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl border border-slate-800 bg-[#121316]">
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(0.75, Number((prev - 0.25).toFixed(2))))}
              title="Zoom out timeline"
              disabled={zoomScale <= 0.75}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-40"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-400 select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(1.5, Number((prev + 0.25).toFixed(2))))}
              title="Zoom in timeline"
              disabled={zoomScale >= 1.5}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-40"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scroll Navigation Controls */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl border border-slate-800 bg-[#121316]">
            <button
              type="button"
              onClick={() => scrollByOffset(-320)}
              title="Scroll left"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollToToday}
              title="Center Today"
              className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer border border-primary/30"
            >
              <Clock className="w-3 h-3" />
              <span>Today</span>
            </button>
            <button
              type="button"
              onClick={() => scrollByOffset(320)}
              title="Scroll right"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Unscheduled Task to Gantt */}
          <button
            type="button"
            onClick={() => openScheduleDialog()}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm shadow-primary/20 cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Add to Gantt</span>
          </button>

          {/* Manage Dependencies Trigger */}
          <button
            type="button"
            onClick={() => setIsDepModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Link2 className="w-3.5 h-3.5 text-primary" />
            <span>Dependencies ({dependencies.length})</span>
          </button>

          {/* Day / Week Resolution Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-800 bg-[#121316] text-[11px]">
            <button
              type="button"
              onClick={() => setResolution("day")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                resolution === "day"
                  ? "bg-primary text-white font-medium shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => setResolution("week")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                resolution === "week"
                  ? "bg-primary text-white font-medium shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Week
            </button>
          </div>

          {/* Expand / Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Exit Fullscreen" : "Expand Gantt to Fullscreen"}
            className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-primary" /> : <Maximize2 className="w-3.5 h-3.5 text-primary" />}
            <span className="hidden md:inline">{isExpanded ? "Collapse" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* Timeline Canvas Container with Horizontal Scroll */}
      <div className={`rounded-2xl border border-slate-800 bg-[#121316] overflow-hidden shadow-md ${isExpanded ? "flex-1 min-h-0 flex flex-col" : ""}`}>
        <div
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className={`overflow-x-auto scroll-smooth scrollbar-thin ${isExpanded ? "flex-1 overflow-y-auto" : ""}`}
        >
          <div style={{ width: `${timelineWidth}px` }} className="relative select-none">
            {/* Header: Row 1 - Month / Year Bands */}
            <div className="flex border-b border-slate-800 bg-[#1a1b1f] sticky top-0 z-30 h-7 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {monthGroups.map((group) => (
                <div
                  key={group.key}
                  style={{ width: `${group.width}px` }}
                  className="shrink-0 px-2.5 flex items-center border-r border-slate-800 truncate bg-[#16171c]"
                >
                  <span className="truncate">{group.label}</span>
                </div>
              ))}
            </div>

            {/* Header: Row 2 - Date Columns */}
            <div className="flex border-b border-slate-800 bg-[#1a1b1f]/95 sticky top-7 z-20 h-10">
              {datesList.map((d, idx) => {
                const isSunday = d.getDay() === 0;
                const isSaturday = d.getDay() === 6;
                const isWeekend = isSunday || isSaturday;
                const isMonday = d.getDay() === 1;
                const isFirstOfMonth = d.getDate() === 1;
                const isToday = d.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    style={{ width: `${cellWidth}px` }}
                    className={`shrink-0 flex flex-col justify-center items-center text-[10px] border-r border-slate-800/40 transition-colors ${
                      isToday
                        ? "bg-primary-subtle text-primary font-bold shadow-inner"
                        : isWeekend
                        ? "bg-slate-900/40 text-slate-500"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title={d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  >
                    {resolution === "day" ? (
                      <>
                        <span className="text-[9px] uppercase opacity-75 font-medium">
                          {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                        </span>
                        <span className="font-mono text-[10px] font-semibold">{d.getDate()}</span>
                      </>
                    ) : isMonday || isFirstOfMonth ? (
                      <span className="font-mono text-[9px] truncate font-medium">
                        {d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-slate-800" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vertical Guide Lines + Canvas Body */}
            <div className="relative min-h-[340px] py-4">
              {/* Today Guideline with Glowing Indicator */}
              <div
                style={{ left: `${todayX + cellWidth / 2}px` }}
                className="absolute top-0 bottom-0 w-[2px] bg-primary z-20 pointer-events-none shadow-[0_0_8px_rgba(66,133,244,0.6)]"
              >
                <div className="sticky top-2 -ml-6 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold tracking-wider uppercase font-mono shadow-lg border border-blue-300/40 text-center">
                  Today
                </div>
              </div>

              {/* Milestone vertical dashed drop lines */}
              {milestones.map((m) => {
                const mx = dateToX(m.targetDate) + cellWidth / 2;
                return (
                  <div
                    key={`milestone-drop-${m.id}`}
                    style={{ left: `${mx}px` }}
                    className="absolute top-0 bottom-0 w-[1px] border-l border-dashed border-amber-500/30 pointer-events-none z-10"
                  />
                );
              })}

              {/* Background vertical day lines and weekend shading */}
              <div className="absolute inset-0 flex pointer-events-none">
                {datesList.map((d, idx) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={idx}
                      style={{ width: `${cellWidth}px` }}
                      className={`shrink-0 border-r border-slate-800/30 h-full ${
                        isToday
                          ? "bg-primary/[0.04]"
                          : isWeekend
                          ? "bg-slate-900/35"
                          : ""
                      }`}
                    />
                  );
                })}
              </div>

              {/* SVG Dependency Connector Curves Overlay */}
              <svg
                style={{ width: `${timelineWidth}px` }}
                className="absolute inset-0 h-full pointer-events-none z-15"
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
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#60A5FA" />
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
                  const y1 = computedTasksStartY + predIdx * taskRowHeight + 14;

                  const x2 = dateToX(succStart);
                  const y2 = computedTasksStartY + succIdx * taskRowHeight + 14;

                  const isBlocked = dep.predecessorStatus !== "done";
                  const c1x = x1 + Math.max(Math.abs(x2 - x1) / 2, 24);
                  const c2x = x2 - Math.max(Math.abs(x2 - x1) / 2, 24);

                  const pathD = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;

                  return (
                    <path
                      key={dep.id}
                      d={pathD}
                      fill="none"
                      stroke={isBlocked ? "#EA4335" : "#60A5FA"}
                      strokeWidth={isBlocked ? 2 : 1.5}
                      strokeDasharray={isBlocked ? "4 3" : undefined}
                      markerEnd={isBlocked ? "url(#arrow-blocked)" : "url(#arrow-resolved)"}
                      className="transition-all opacity-85 hover:opacity-100"
                    />
                  );
                })}
              </svg>

              <div className="space-y-4 relative z-10 px-3">
                {/* 1. Project Duration Envelope */}
                {project.startDate && project.targetDate && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1 flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-primary" />
                      <span>Project Horizon</span>
                    </div>

                    <div className="relative h-7 flex items-center">
                      {(() => {
                        const startX = dateToX(project.startDate);
                        const endX = dateToX(project.targetDate) + cellWidth;
                        const width = Math.max(endX - startX, cellWidth);

                        return (
                          <div
                            style={{ left: `${startX}px`, width: `${width}px` }}
                            className="absolute h-6 rounded-lg border border-blue-500/40 bg-gradient-to-r from-blue-600/25 via-indigo-600/20 to-blue-500/15 flex items-center px-2.5 text-xs text-white font-medium truncate shadow-sm backdrop-blur-sm"
                            title={`Project: ${project.name} (${project.startDate} to ${project.targetDate})`}
                          >
                            <span className="truncate font-semibold">{project.name}</span>
                            <span className="ml-auto text-[10px] font-mono text-blue-300 opacity-80 shrink-0">
                              {project.startDate} → {project.targetDate}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 2. Milestones Row */}
                {milestones.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 pl-1 flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5" />
                      <span>Milestones</span>
                    </div>

                    <div className="relative h-8 flex items-center">
                      {milestones.map((m) => {
                        const x = dateToX(m.targetDate) + cellWidth / 2;

                        return (
                          <div
                            key={m.id}
                            style={{ left: `${x}px` }}
                            className="absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer z-20"
                            title={`${m.title} (${m.targetDate}) - ${m.isCompleted ? "Completed" : "Pending"}`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rotate-45 border shadow-sm transition-transform group-hover:scale-125 ${
                                m.isCompleted
                                  ? "bg-emerald-500 border-emerald-300 shadow-emerald-500/30"
                                  : "bg-amber-500 border-amber-300 animate-pulse shadow-amber-500/30"
                              }`}
                            />
                            <span className="text-[10px] font-semibold text-slate-200 mt-1.5 whitespace-nowrap bg-[#1a1b1f] px-2 py-0.5 rounded-md border border-slate-700 shadow-md">
                              {m.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Scheduled Tasks Bars with Gantt Drag Handles */}
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    <span>Dated Tasks (Interactive Gantt)</span>
                  </div>

                  {scheduledTasks.length === 0 ? (
                    <div className="p-4 text-xs text-slate-500 italic bg-[#1a1b1f]/40 rounded-xl border border-slate-800">
                      No tasks have dates assigned yet. Click "Add to Gantt" above or schedule tasks from the tray below.
                    </div>
                  ) : (
                    scheduledTasks.map((t, idx) => {
                      const taskStart = toDateStr(t.startDate || t.dueDate!);
                      const taskEnd = toDateStr(t.dueDate || t.startDate!);

                      const startX = dateToX(taskStart);
                      const endX = dateToX(taskEnd) + cellWidth;
                      const width = Math.max(endX - startX, 36);

                      const isDone = t.status === "done";
                      const blockedInfo = blockedMap.get(t.id);
                      const isBlocked = !isDone && !!blockedInfo?.isBlocked;
                      const isCurrentlyDragging = activeDrag?.taskId === t.id;

                      const priorityColor =
                        PRIORITY_CONFIG[t.priority]?.badgeClass || "border-slate-700 text-slate-300";

                      const taskNum = t.task_number || t.taskNumber;
                      const taskSpanDays = Math.max(
                        1,
                        Math.round(
                          (parseDateOnly(taskEnd).getTime() - parseDateOnly(taskStart).getTime()) / 86400000
                        ) + 1
                      );

                      return (
                        <div key={t.id} className="relative h-8 flex items-center group">
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
                            className={`absolute h-7 rounded-lg border text-xs flex items-center justify-between gap-1 select-none cursor-grab active:cursor-grabbing outline-none focus:ring-2 focus:ring-primary/80 transition-shadow ${
                              isCurrentlyDragging
                                ? "ring-2 ring-primary bg-primary/40 border-primary z-30 shadow-lg shadow-primary/30"
                                : isDone
                                ? "bg-emerald-950/25 border-emerald-500/30 text-slate-400 hover:border-emerald-500/50"
                                : isBlocked
                                ? "bg-rose-950/40 border-rose-500/60 text-white hover:border-rose-400 shadow-sm shadow-rose-950/30"
                                : "bg-gradient-to-r from-blue-600/30 via-blue-500/20 to-blue-600/25 border-blue-500/50 text-white hover:border-blue-400 hover:bg-blue-600/35 shadow-sm shadow-blue-500/10"
                            }`}
                            onPointerDown={(e) => handlePointerDown(e, t, "move")}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            title={`${t.title} (${taskStart} to ${taskEnd})${
                              isBlocked ? ` - BLOCKED by: ${blockedInfo?.blockers.join(", ")}` : ""
                            } • Drag bar to move, drag edges to resize`}
                          >
                            {/* Dragging Floating Date Preview Tooltip */}
                            {isCurrentlyDragging && (
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900 border border-primary text-primary text-[10px] font-mono font-bold whitespace-nowrap shadow-xl pointer-events-none z-40">
                                {taskStart} → {taskEnd} ({taskSpanDays}d)
                              </div>
                            )}

                            {/* Left Handle: Resize Start Date */}
                            <div
                              role="button"
                              aria-label="Resize start date"
                              onPointerDown={(e) => handlePointerDown(e, t, "resize-start")}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                              <div className="w-[3px] h-3.5 bg-white/70 rounded-full" />
                            </div>

                            {/* Center Content */}
                            <div className="flex items-center gap-1.5 truncate px-2.5 pointer-events-none min-w-0">
                              {/* Task Unique ID */}
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40 text-blue-300 border border-blue-500/30 shrink-0">
                                {taskNum ? `TSK-${taskNum}` : `#${idx + 1}`}
                              </span>

                              {/* Status indicator */}
                              {isDone ? (
                                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              ) : isBlocked ? (
                                <Lock className="w-3 h-3 text-rose-400 shrink-0 animate-pulse" />
                              ) : null}

                              {/* Title */}
                              <span className={`truncate font-medium text-[11px] ${isDone ? "line-through text-slate-400" : "text-white"}`}>
                                {t.title}
                              </span>
                            </div>

                            {/* Priority badge */}
                            <span
                              className={`text-[8px] uppercase font-bold px-1.5 py-0.2 rounded border shrink-0 mr-2 pointer-events-none ml-auto ${priorityColor}`}
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
                              className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                              <div className="w-[3px] h-3.5 bg-white/70 rounded-full" />
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
            <div className="p-3 rounded-xl border border-slate-700 bg-[#1a1b1f]/95 text-white text-xs shadow-2xl flex items-center justify-between gap-3 backdrop-blur-sm">
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
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#1a1b1f] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Unscheduled Tasks ({unscheduledTasks.length})</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Tasks without dates • Click schedule to assign timeline dates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {unscheduledTasks.map((t, idx) => {
              const taskNum = t.task_number || t.taskNumber;
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-800 bg-[#121316] hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs group shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-850 text-slate-300 border border-slate-700 shrink-0">
                      {taskNum ? `TSK-${taskNum}` : `#${idx + 1}`}
                    </span>
                    <span className="text-slate-200 truncate font-medium">{t.title}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                        PRIORITY_CONFIG[t.priority]?.badgeClass || "border-slate-700 text-slate-400"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        executeReschedule(
                          t.id,
                          toDateStr(new Date()),
                          toDateStr(new Date()),
                          t.version || 1
                        )
                      }
                      title="Schedule for Today"
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => openScheduleDialog(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      <span>Schedule</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Unscheduled Task Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#1a1b1f] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-primary" />
                <span>Add Task to Gantt Chart</span>
              </h3>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Select Unscheduled Task
                </label>
                <select
                  value={selectedUnscheduledTaskId}
                  onChange={(e) => setSelectedUnscheduledTaskId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#121316] text-white focus:outline-none focus:border-primary"
                >
                  {unscheduledTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.priority})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#121316] text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={scheduleDueDate}
                    onChange={(e) => setScheduleDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#121316] text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setScheduleModalOpen(false);
                  setIsQuickCaptureOpen(true);
                }}
                className="text-primary hover:underline text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleConfirm}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-md shadow-primary/20 transition cursor-pointer"
                >
                  Place on Gantt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Capture Dialog for creating new task in this project */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        defaultProjectId={project.id}
        defaultTab="task"
        lockTab={true}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

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
