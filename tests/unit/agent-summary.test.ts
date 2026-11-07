import { describe, it, expect } from "vitest";
import {
  buildSummaryPrompt,
  summaryOutputSchema,
} from "@/lib/agent/prompts/summary";
import { computeRelevantWorkspaceItems } from "@/lib/agent/summary";

describe("Agent Summaries & Daily Planner", () => {
  it("should computationally rank urgent bugs and overdue tasks first with IDs", () => {
    const data = {
      tasks: [
        { id: "t1", taskNumber: 10, title: "Overdue task", priority: "medium", status: "in_progress", dueDate: "2020-01-01" },
        { id: "t2", taskNumber: 11, title: "Low backlog task", priority: "low", status: "todo" },
      ],
      bugs: [
        { id: "b1", bugNumber: 5, title: "Urgent auth crash", priority: "urgent", status: "open" },
        { id: "b2", bugNumber: 6, title: "Resolved defect", priority: "high", status: "resolved" },
      ],
      learnings: [
        { id: "l1", title: "React 19 Server Actions", reviewBox: 2, reviewStatus: "review" },
      ],
    };

    const plan = computeRelevantWorkspaceItems("daily_plan", data);

    expect(plan.focusItems.length).toBeGreaterThan(0);
    // Urgent bug b1 should be top priority
    expect(plan.focusItems[0].itemId).toBe("BUG-5");
    expect(plan.focusItems[0].title).toBe("Urgent auth crash");
    expect(plan.focusItems[0].rationale).toContain("Critical");

    // Overdue task should also be prioritized
    const taskItem = plan.focusItems.find((f) => f.itemId === "TSK-10");
    expect(taskItem).toBeDefined();
    expect(taskItem?.rationale).toContain("Overdue");

    // Resolved bug should not appear in daily focus
    expect(plan.focusItems.some((f) => f.itemId === "BUG-6")).toBe(false);
  });

  it("should compile standup bullets with IDs for weekly standup", () => {
    const data = {
      tasks: [
        { id: "t1", taskNumber: 1, title: "Implement Gantt view", status: "done" },
        { id: "t2", taskNumber: 2, title: "WIP feature", status: "in_progress" },
      ],
      bugs: [
        { id: "b1", bugNumber: 3, title: "Memory leak in node pool", status: "resolved" },
      ],
      learnings: [
        { id: "l1", title: "PostgreSQL B-Tree indexes", reviewBox: 3 },
      ],
    };

    const standup = computeRelevantWorkspaceItems("weekly_standup", data);

    expect(standup.standupBullets).toContainEqual(expect.stringContaining("[BUG-3] Fixed defect: Memory leak in node pool"));
    expect(standup.standupBullets).toContainEqual(expect.stringContaining("[TSK-1] Completed: Implement Gantt view"));
    expect(standup.standupBullets).toContainEqual(expect.stringContaining("[Knowledge] Mastered: PostgreSQL B-Tree indexes"));
  });
  it("should construct daily plan prompt with user workspace records", () => {
    const data = {
      tasks: [{ id: "t1", title: "Migrate auth to v5", priority: "urgent", status: "todo" }],
      bugs: [{ id: "b1", title: "PgBouncer connection drop", priority: "high", status: "open" }],
      learnings: [{ id: "l1", title: "Next.js edge runtime limitations", reviewBox: 1, reviewStatus: "learning" }],
    };

    const { userPrompt, systemInstruction } = buildSummaryPrompt("daily_plan", data);

    expect(systemInstruction).toContain("Engineering Summaries & Daily Planning Agent");
    expect(userPrompt).toContain("Mode: daily_plan");
    expect(userPrompt).toContain("Migrate auth to v5");
    expect(userPrompt).toContain("PgBouncer connection drop");
    expect(userPrompt).toContain("Next.js edge runtime limitations");
  });

  it("should validate weekly standup and daily plan output schemas", () => {
    const validPlanOutput = {
      mode: "daily_plan",
      markdownSummary: "## Focus for today\n1. PgBouncer bug",
      dailyPlan: {
        headline: "High-priority infrastructure fixes",
        focusItems: [
          {
            itemId: "b1",
            type: "bug",
            title: "PgBouncer connection drop",
            priority: "high",
            rationale: "Blocks concurrent user traffic.",
          },
        ],
        quickWins: ["Review 1 learning card in spaced review"],
        reviewReminder: "You have 1 learning due today.",
      },
    };

    const parsed = summaryOutputSchema.safeParse(validPlanOutput);
    expect(parsed.success).toBe(true);
  });

  it("should auto-heal output when mode or markdownSummary are missing", () => {
    // Model returns raw daily plan without mode or markdownSummary
    const rawOutput = {
      headline: "Today's Priorities",
      focusItems: [
        {
          title: "Fix auth token expiry",
          priority: "urgent",
          rationale: "Prevents logouts",
        },
      ],
    };

    const parsed = summaryOutputSchema.safeParse(rawOutput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mode).toBe("daily_plan");
      expect(parsed.data.markdownSummary).toContain("Today's Priorities");
      expect(parsed.data.dailyPlan?.headline).toBe("Today's Priorities");
    }
  });
});
