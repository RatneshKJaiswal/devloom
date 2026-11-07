import { describe, it, expect } from "vitest";
import { calculateRecallHeatmap } from "@/lib/heatmap";

describe("Recall Activity Heatmap Engine", () => {
  it("should generate a full calendar year of 52-53 weeks with all 12 months", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result = calculateRecallHeatmap([], 2026, refDate);

    expect(result.weeks.length).toBeGreaterThanOrEqual(52);
    expect(result.weeks.length).toBeLessThanOrEqual(54);
    for (const week of result.weeks) {
      expect(week).toHaveLength(7);
    }
    expect(result.monthLabels).toHaveLength(12);
    expect(result.monthLabels[0].month).toBe("Jan");
    expect(result.monthLabels[11].month).toBe("Dec");
    expect(result.totalActivities).toBe(0);
    expect(result.activeDaysCount).toBe(0);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.year).toBe(2026);
  });

  it("should support prior calendar years (current - 1, current - 2)", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const result2025 = calculateRecallHeatmap([], 2025, refDate);
    const result2024 = calculateRecallHeatmap([], 2024, refDate);

    expect(result2025.weeks.length).toBeGreaterThanOrEqual(52);
    expect(result2025.monthLabels).toHaveLength(12);
    expect(result2025.year).toBe(2025);

    expect(result2024.weeks.length).toBeGreaterThanOrEqual(52);
    expect(result2024.monthLabels).toHaveLength(12);
    expect(result2024.year).toBe(2024);
  });

  it("should aggregate activities by date and calculate streaks & active days", () => {
    const refDate = new Date("2026-11-08T12:00:00Z");
    const items = [
      { createdAt: "2026-11-08T09:00:00Z", lastReviewedAt: null },
      { createdAt: "2026-11-07T10:00:00Z", lastReviewedAt: "2026-11-07T18:00:00Z" },
      { createdAt: "2026-11-06T11:00:00Z", lastReviewedAt: null },
    ];

    const result = calculateRecallHeatmap(items, 2026, refDate);

    expect(result.totalActivities).toBe(4); // 1 + 2 + 1
    expect(result.activeDaysCount).toBe(3); // 3 distinct active days
    expect(result.currentStreak).toBe(3); // 2026-11-08, 2026-11-07, 2026-11-06
    expect(result.longestStreak).toBe(3);
  });
});
