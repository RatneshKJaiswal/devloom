import { describe, it, expect } from "vitest";
import {
  buildSummaryPrompt,
  summaryOutputSchema,
} from "@/lib/agent/prompts/summary";

describe("Agent Summaries & Daily Planner", () => {
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
