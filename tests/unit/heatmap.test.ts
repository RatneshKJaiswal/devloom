import { describe, it, expect } from "vitest";
import { calculateRecallHeatmap } from "@/lib/heatmap";

describe("Recall Activity Heatmap Engine", () => {
  it("should generate 12 weekly columns with 7 days each", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result = calculateRecallHeatmap([], refDate);

    expect(result.weeks).toHaveLength(12);
    for (const week of result.weeks) {
      expect(week).toHaveLength(7);
    }
    expect(result.totalActivities).toBe(0);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("should aggregate activities by date and calculate streaks", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const items = [
      { createdAt: "2026-11-08T09:00:00Z", lastReviewedAt: null },
      { createdAt: "2026-11-07T10:00:00Z", lastReviewedAt: "2026-11-07T18:00:00Z" },
      { createdAt: "2026-11-06T11:00:00Z", lastReviewedAt: null },
    ];

    const result = calculateRecallHeatmap(items, refDate);

    expect(result.totalActivities).toBe(4); // 1 + 2 + 1
    expect(result.currentStreak).toBe(3); // 2026-11-08, 2026-11-07, 2026-11-06
    expect(result.longestStreak).toBe(3);
  });

  it("should detect month transitions across columns", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result = calculateRecallHeatmap([], refDate);

    expect(result.monthLabels.length).toBeGreaterThan(0);
    expect(result.monthLabels.some((m) => m.month === "Nov")).toBe(true);
  });
});
