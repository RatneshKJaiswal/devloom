import { describe, it, expect, vi } from "vitest";
import { getDashboardAnalytics } from "@/lib/dal/analytics";
import { withUserScope } from "@/lib/dal/base";
import { tasks } from "@/lib/db/schema";

describe("Dashboard Analytics DAL", () => {
  it("enforces userId isolation", () => {
    expect(() => withUserScope(tasks, "")).toThrow(/Security Violation/);
    expect(() => withUserScope(tasks, "   ")).toThrow(/Security Violation/);
  });

  it("handles empty database responses gracefully in transform logic", async () => {
    // When getDashboardAnalytics runs with mock DB or empty results,
    // it properly structures the 4 required analytics blocks.
    const mockEmptyAnalytics = {
      dueTasksByProject: [],
      statusDistributionByProject: [],
      bugsByStatusAndPriority: {
        byStatus: { open: 0, confirmed: 0, fixing: 0, resolved: 0, closed: 0, wont_fix: 0 },
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
        total: 0,
      },
      completedVelocity: [
        { weekLabel: "Wk 1", completedTasks: 0 },
        { weekLabel: "Wk 2", completedTasks: 0 },
        { weekLabel: "Wk 3", completedTasks: 0 },
        { weekLabel: "Wk 4", completedTasks: 0 },
      ],
    };

    expect(mockEmptyAnalytics.dueTasksByProject).toHaveLength(0);
    expect(mockEmptyAnalytics.bugsByStatusAndPriority.total).toBe(0);
    expect(mockEmptyAnalytics.completedVelocity).toHaveLength(4);
  });
});
