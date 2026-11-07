/**
 * Helpers for formatting human-friendly, unique engineering identifiers.
 */

export function formatTaskId(task: {
  taskNumber?: number | null;
  id?: string | null;
}): string {
  if (task.taskNumber) return `TSK-${task.taskNumber}`;
  if (task.id) {
    const clean = task.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    return `TSK-${clean}`;
  }
  return "TSK";
}

export function formatBugId(bug: {
  bugNumber?: number | null;
  id?: string | null;
}): string {
  if (bug.bugNumber) return `BUG-${bug.bugNumber}`;
  if (bug.id) {
    const clean = bug.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    return `BUG-${clean}`;
  }
  return "BUG";
}
