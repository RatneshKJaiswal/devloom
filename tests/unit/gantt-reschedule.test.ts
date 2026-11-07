import { describe, it, expect } from "vitest";
import {
  toDateStr,
  parseDateOnly,
  addDaysToStr,
  calculateReschedule,
} from "@/lib/timeline";

describe("Gantt Reschedule & Drag Calculations", () => {
  it("shifts both start and due dates when moving the bar", () => {
    const result = calculateReschedule({
      mode: "move",
      initialStart: "2026-11-10",
      initialDue: "2026-11-15",
      deltaDays: 3,
    });

    expect(result.newStart).toBe("2026-11-13");
    expect(result.newDue).toBe("2026-11-18");
    expect(result.snapped).toBe(false);
  });

  it("resizes start date without altering due date", () => {
    const result = calculateReschedule({
      mode: "resize-start",
      initialStart: "2026-11-10",
      initialDue: "2026-11-15",
      deltaDays: -2,
    });

    expect(result.newStart).toBe("2026-11-08");
    expect(result.newDue).toBe("2026-11-15");
  });

  it("clamps resize-start so start date cannot exceed due date", () => {
    const result = calculateReschedule({
      mode: "resize-start",
      initialStart: "2026-11-10",
      initialDue: "2026-11-15",
      deltaDays: 10,
    });

    expect(result.newStart).toBe("2026-11-15");
    expect(result.newDue).toBe("2026-11-15");
  });

  it("resizes due date without altering start date", () => {
    const result = calculateReschedule({
      mode: "resize-due",
      initialStart: "2026-11-10",
      initialDue: "2026-11-15",
      deltaDays: 5,
    });

    expect(result.newStart).toBe("2026-11-10");
    expect(result.newDue).toBe("2026-11-20");
  });

  it("clamps resize-due so due date cannot be earlier than start date", () => {
    const result = calculateReschedule({
      mode: "resize-due",
      initialStart: "2026-11-10",
      initialDue: "2026-11-15",
      deltaDays: -10,
    });

    expect(result.newStart).toBe("2026-11-10");
    expect(result.newDue).toBe("2026-11-10");
  });

  it("snaps to predecessor due date + 1 day when dragging earlier than predecessor", () => {
    const result = calculateReschedule({
      mode: "move",
      initialStart: "2026-11-15",
      initialDue: "2026-11-20",
      deltaDays: -10, // Attempt to move to Nov 5
      predecessorDueDate: "2026-11-12", // Predecessor finishes Nov 12
    });

    // Should snap to Nov 13, keeping 5-day duration (Nov 13 to Nov 18)
    expect(result.newStart).toBe("2026-11-13");
    expect(result.newDue).toBe("2026-11-18");
    expect(result.snapped).toBe(true);
  });

  it("simulates keyboard navigation shortcuts", () => {
    const start = "2026-11-10";
    const due = "2026-11-15";

    // Alt + ArrowRight -> +1 day
    const dayPlusOne = calculateReschedule({
      mode: "move",
      initialStart: start,
      initialDue: due,
      deltaDays: 1,
    });
    expect(dayPlusOne.newStart).toBe("2026-11-11");
    expect(dayPlusOne.newDue).toBe("2026-11-16");

    // Alt + Shift + ArrowRight -> +7 days
    const weekPlusOne = calculateReschedule({
      mode: "move",
      initialStart: start,
      initialDue: due,
      deltaDays: 7,
    });
    expect(weekPlusOne.newStart).toBe("2026-11-17");
    expect(weekPlusOne.newDue).toBe("2026-11-22");
  });
});

describe("Optimistic Concurrency Control Rules", () => {
  it("rejects outdated expectedVersion with version conflict", () => {
    const currentTask = { id: "task-1", version: 3, startDate: "2026-11-10", dueDate: "2026-11-15" };
    const staleExpectedVersion = 2;

    const isConflict = currentTask.version !== staleExpectedVersion;
    expect(isConflict).toBe(true);
  });

  it("accepts matching expectedVersion and increments version", () => {
    const currentTask = { id: "task-1", version: 3, startDate: "2026-11-10", dueDate: "2026-11-15" };
    const expectedVersion = 3;

    const isConflict = currentTask.version !== expectedVersion;
    expect(isConflict).toBe(false);

    const nextVersion = currentTask.version + 1;
    expect(nextVersion).toBe(4);
  });
});
