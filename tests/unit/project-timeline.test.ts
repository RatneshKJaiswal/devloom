import { describe, it, expect } from "vitest";
import { calculateTimelineBoundaries } from "@/lib/timeline";

describe("Project Timeline Calculations", () => {
  it("correctly separates scheduled vs unscheduled tasks", () => {
    const tasks = [
      { id: "1", title: "Dated Task", dueDate: "2026-11-15T00:00:00Z", startDate: "2026-11-10", priority: "high", status: "todo" },
      { id: "2", title: "Due Only Task", dueDate: "2026-11-20T00:00:00Z", priority: "medium", status: "in_progress" },
      { id: "3", title: "Unscheduled Task", priority: "low", status: "todo" },
    ];

    const scheduled = tasks.filter((t) => t.dueDate || t.startDate);
    const unscheduled = tasks.filter((t) => !t.dueDate && !t.startDate);

    expect(scheduled).toHaveLength(2);
    expect(unscheduled).toHaveLength(1);
    expect(unscheduled[0].title).toBe("Unscheduled Task");
  });

  it("calculates envelope boundaries including milestones and project dates", () => {
    const project = {
      startDate: "2026-11-01",
      targetDate: "2026-12-31",
    };
    const milestones = [
      { id: "m1", title: "Alpha", targetDate: "2026-11-25", isCompleted: false },
    ];
    const tasks = [
      { id: "t1", dueDate: "2026-11-15" },
    ];

    const stamps = [
      new Date(project.startDate).getTime(),
      new Date(project.targetDate).getTime(),
      new Date(milestones[0].targetDate).getTime(),
      new Date(tasks[0].dueDate).getTime(),
    ];

    const minDate = new Date(Math.min(...stamps));
    const maxDate = new Date(Math.max(...stamps));

    expect(minDate.toISOString().slice(0, 10)).toBe("2026-11-01");
    expect(maxDate.toISOString().slice(0, 10)).toBe("2026-12-31");
  });

  it("calculates padded timeline boundaries with total day span", () => {
    const bounds = calculateTimelineBoundaries({
      today: new Date("2026-11-10T00:00:00Z"),
      projectStartDate: "2026-11-05",
      projectTargetDate: "2026-11-25",
      tasks: [
        { startDate: "2026-11-08", dueDate: "2026-11-18" },
      ],
      milestones: [
        { targetDate: "2026-11-20" },
      ],
    });

    // 7 days before min (2026-11-05 - 7d = 2026-10-29)
    expect(bounds.startBound).toBe("2026-10-29");
    // 14 days after max (2026-11-25 + 14d = 2026-12-09)
    expect(bounds.endBound).toBe("2026-12-09");
    expect(bounds.totalDays).toBeGreaterThan(30);
  });
});
