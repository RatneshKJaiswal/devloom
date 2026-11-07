/**
 * Pure timeline and Gantt calculation engine.
 * Handles date formatting, span arithmetic, boundary calculation,
 * dependency boundary snapping, and date shift enforcement.
 */

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

export function computeDaysBetween(startStr: string, endStr: string): number {
  const startMs = parseDateOnly(startStr).getTime();
  const endMs = parseDateOnly(endStr).getTime();
  return Math.round((endMs - startMs) / 86400000);
}

export interface RescheduleCalculationInput {
  mode: "move" | "resize-start" | "resize-due";
  initialStart: string;
  initialDue: string;
  deltaDays: number;
  predecessorDueDate?: string | null;
}

export interface RescheduleCalculationResult {
  newStart: string;
  newDue: string;
  snapped: boolean;
}

/**
 * Pure calculation for moving or resizing a task bar in Gantt.
 * Enforces:
 * 1. candidate start >= predecessorDueDate + 1 day (dependency preservation)
 * 2. candidate due >= candidate start (duration >= 1 day)
 */
export function calculateReschedule({
  mode,
  initialStart,
  initialDue,
  deltaDays,
  predecessorDueDate,
}: RescheduleCalculationInput): RescheduleCalculationResult {
  let newStart = initialStart;
  let newDue = initialDue;
  let snapped = false;

  if (mode === "move") {
    newStart = addDaysToStr(initialStart, deltaDays);
    newDue = addDaysToStr(initialDue, deltaDays);

    // Dependency snap enforcement: candidate start cannot be before predecessorDueDate + 1 day
    if (predecessorDueDate) {
      const minValidStart = addDaysToStr(predecessorDueDate, 1);
      if (newStart < minValidStart) {
        const durationDays = computeDaysBetween(initialStart, initialDue);
        newStart = minValidStart;
        newDue = addDaysToStr(newStart, durationDays);
        snapped = true;
      }
    }
  } else if (mode === "resize-start") {
    const candidateStart = addDaysToStr(initialStart, deltaDays);
    const minValidStart = predecessorDueDate ? addDaysToStr(predecessorDueDate, 1) : null;

    if (minValidStart && candidateStart < minValidStart) {
      newStart = minValidStart;
      snapped = true;
    } else if (candidateStart > newDue) {
      newStart = newDue;
    } else {
      newStart = candidateStart;
    }
  } else if (mode === "resize-due") {
    const candidateDue = addDaysToStr(initialDue, deltaDays);
    if (candidateDue < newStart) {
      newDue = newStart;
    } else {
      newDue = candidateDue;
    }
  }

  return { newStart, newDue, snapped };
}

export interface TimelineBoundsInput {
  today?: Date;
  projectStartDate?: string | null;
  projectTargetDate?: string | null;
  tasks?: Array<{ startDate?: string | null; dueDate?: string | null }>;
  milestones?: Array<{ targetDate?: string | null }>;
}

export function calculateTimelineBoundaries({
  today = new Date(),
  projectStartDate,
  projectTargetDate,
  tasks = [],
  milestones = [],
}: TimelineBoundsInput) {
  const todayCopy = new Date(today);
  todayCopy.setHours(0, 0, 0, 0);

  const stamps: number[] = [todayCopy.getTime()];

  if (projectStartDate) stamps.push(parseDateOnly(projectStartDate).getTime());
  if (projectTargetDate) stamps.push(parseDateOnly(projectTargetDate).getTime());

  for (const t of tasks) {
    if (t.startDate) stamps.push(parseDateOnly(t.startDate).getTime());
    if (t.dueDate) stamps.push(parseDateOnly(t.dueDate).getTime());
  }

  for (const m of milestones) {
    if (m.targetDate) stamps.push(parseDateOnly(m.targetDate).getTime());
  }

  const minStamp = Math.min(...stamps);
  const maxStamp = Math.max(...stamps);

  const startBound = new Date(minStamp);
  startBound.setDate(startBound.getDate() - 7);

  const endBound = new Date(maxStamp);
  endBound.setDate(endBound.getDate() + 14);

  return {
    startBound: toDateStr(startBound),
    endBound: toDateStr(endBound),
    totalDays: Math.round((endBound.getTime() - startBound.getTime()) / 86400000) + 1,
  };
}
