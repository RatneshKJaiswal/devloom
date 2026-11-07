import { describe, it, expect } from "vitest";
import { calculateCriticalPath } from "@/lib/timeline";

describe("Gantt Critical Path Engine (CPM)", () => {
  it("should identify all tasks in a linear sequential chain as critical", () => {
    const tasks = [
      { id: "task-1", startDate: "2026-11-01", dueDate: "2026-11-05" }, // 5 days
      { id: "task-2", startDate: "2026-11-06", dueDate: "2026-11-10" }, // 5 days
      { id: "task-3", startDate: "2026-11-11", dueDate: "2026-11-15" }, // 5 days
    ];

    const dependencies = [
      { taskId: "task-2", dependsOnTaskId: "task-1" },
      { taskId: "task-3", dependsOnTaskId: "task-2" },
    ];

    const criticalPath = calculateCriticalPath(tasks, dependencies);

    expect(criticalPath.has("task-1")).toBe(true);
    expect(criticalPath.has("task-2")).toBe(true);
    expect(criticalPath.has("task-3")).toBe(true);
    expect(criticalPath.size).toBe(3);
  });

  it("should distinguish the longest path from parallel paths with slack", () => {
    // A starts at day 0
    // Path 1: A -> B (duration 10) -> D
    // Path 2: A -> C (duration 2) -> D
    // Critical path must be: A, B, D. C has float/slack and is non-critical.
    const tasks = [
      { id: "task-A", startDate: "2026-11-01", dueDate: "2026-11-03" }, // 3 days
      { id: "task-B", startDate: "2026-11-04", dueDate: "2026-11-14" }, // 11 days (bottleneck)
      { id: "task-C", startDate: "2026-11-04", dueDate: "2026-11-05" }, // 2 days (fast branch)
      { id: "task-D", startDate: "2026-11-15", dueDate: "2026-11-18" }, // 4 days (final merge)
    ];

    const dependencies = [
      { taskId: "task-B", dependsOnTaskId: "task-A" },
      { taskId: "task-C", dependsOnTaskId: "task-A" },
      { taskId: "task-D", dependsOnTaskId: "task-B" },
      { taskId: "task-D", dependsOnTaskId: "task-C" },
    ];

    const criticalPath = calculateCriticalPath(tasks, dependencies);

    expect(criticalPath.has("task-A")).toBe(true);
    expect(criticalPath.has("task-B")).toBe(true);
    expect(criticalPath.has("task-D")).toBe(true);
    expect(criticalPath.has("task-C")).toBe(false); // C has 9 days of slack
  });

  it("should handle empty or undated tasks gracefully", () => {
    expect(calculateCriticalPath([], [])).toEqual(new Set());
    expect(
      calculateCriticalPath(
        [{ id: "task-x", startDate: null, dueDate: null }],
        []
      )
    ).toEqual(new Set());
  });
});
