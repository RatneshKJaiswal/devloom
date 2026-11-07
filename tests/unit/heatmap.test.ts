import { describe, it, expect } from "vitest";
import { calculateRecallHeatmap } from "@/lib/heatmap";

describe("Recall Activity Heatmap Engine", () => {
  it("should generate 52 weekly columns by default (yearly calendar)", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result = calculateRecallHeatmap([], refDate);

    expect(result.weeks).toHaveLength(52);
    for (const week of result.weeks) {
      expect(week).toHaveLength(7);
    }
    expect(result.totalActivities).toBe(0);
    expect(result.activeDaysCount).toBe(0);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("should support custom week range (e.g. 12 weeks)", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result = calculateRecallHeatmap([], refDate, 12);

    expect(result.weeks).toHaveLength(12);
    for (const week of result.weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("should aggregate activities by date and calculate streaks & active days", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const items = [
      { createdAt: "2026-11-08T09:00:00Z", lastReviewedAt: null },
      { createdAt: "2026-11-07T10:00:00Z", lastReviewedAt: "2026-11-07T18:00:00Z" },
      { createdAt: "2026-11-06T11:00:00Z", lastReviewedAt: null },
    ];

    const result = calculateRecallHeatmap(items, refDate, 52);

    expect(result.totalActivities).toBe(4); // 1 + 2 + 1
    expect(result.activeDaysCount).toBe(3); // 3 distinct active days
    expect(result.currentStreak).toBe(3); // 2026-11-08, 2026-11-07, 2026-11-06
    expect(result.longestStreak).toBe(3);
  });

  it("should detect month transitions across columns without overlap", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result = calculateRecallHeatmap([], refDate, 52);

    expect(result.monthLabels.length).toBeGreaterThan(6);
    expect(result.monthLabels.some((m) => m.month === "Nov")).toBe(true);
  });
});
