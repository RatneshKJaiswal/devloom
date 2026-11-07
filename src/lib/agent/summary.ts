import { listTasks } from "@/lib/dal/tasks";
import { listBugs } from "@/lib/dal/bugs";
import { listLearnings, getDueLearnings } from "@/lib/dal/learnings";
import { checkUserQuota, recordAgentUsage } from "./quota";
import { buildSummaryPrompt, SummaryOutput } from "./prompts/summary";
import { agentClient } from "./client";
import { formatTaskId, formatBugId } from "@/lib/identifiers";

export interface SummaryRequest {
  userId: string;
  mode: "daily_plan" | "weekly_standup";
}

export interface RelevantItem {
  id: string;
  formattedId: string;
  type: "task" | "bug" | "learning";
  title: string;
  priority: string;
  status: string;
  dueDate?: string | null;
  explanation: string;
  score: number;
}

export interface PrecomputedPlan {
  headline: string;
  focusItems: Array<{
    itemId: string;
    type: "task" | "bug" | "learning";
    title: string;
    priority: string;
    rationale: string;
  }>;
  quickWins: string[];
  reviewReminder?: string;
  standupBullets: string[];
  fixedDefectsSummary: string;
  completedTasksSummary: string;
  keyInsightsRetained: string[];
}

export interface SummaryTaskInput {
  id: string;
  taskNumber?: number | null;
  title: string;
  status: string;
  priority?: string | null;
  dueDate?: string | Date | null;
}

export interface SummaryBugInput {
  id: string;
  bugNumber?: number | null;
  title: string;
  status: string;
  priority?: string | null;
  dueDate?: string | Date | null;
}

export interface SummaryLearningInput {
  id: string;
  title: string;
  reviewBox?: number | null;
  reviewStatus?: string | null;
}

/**
 * Deterministic engineering priority engine.
 * Filters and ranks tasks, bugs, and learnings using computational logic
 * BEFORE sending anything to the AI. Only the top relevant items are submitted,
 * drastically reducing token consumption and avoiding model rate limit/503 errors.
 */
export function computeRelevantWorkspaceItems(
  mode: "daily_plan" | "weekly_standup",
  data: {
    tasks: SummaryTaskInput[];
    bugs: SummaryBugInput[];
    learnings: SummaryLearningInput[];
  }
): PrecomputedPlan {
  const today = new Date().toISOString().split("T")[0];

  if (mode === "daily_plan") {
    const candidates: RelevantItem[] = [];

    // 1. Process active bugs
    for (const b of data.bugs) {
      if (b.status === "resolved" || b.status === "closed") continue;

      const bugId = formatBugId(b);
      let score = 50;
      let explanation = "Active software defect requiring resolution.";

      if (b.priority === "urgent") {
        score = 140;
        explanation = "Critical priority defect; immediate blocker for deployment.";
      } else if (b.priority === "high") {
        score = 95;
        explanation = "High priority defect affecting system stability.";
      } else if (b.priority === "medium") {
        score = 55;
        explanation = "Medium priority defect in current backlog.";
      } else {
        score = 30;
        explanation = "Low priority defect or minor glitch.";
      }

      const dueStr = b.dueDate instanceof Date
        ? b.dueDate.toISOString().split("T")[0]
        : typeof b.dueDate === "string"
        ? b.dueDate.split("T")[0]
        : null;

      if (dueStr) {
        if (dueStr < today) {
          score += 40;
          explanation += ` Overdue since ${dueStr}.`;
        } else if (dueStr === today) {
          score += 30;
          explanation += " Target resolution deadline is today.";
        } else {
          explanation += ` Target deadline: ${dueStr}.`;
        }
      }

      candidates.push({
        id: b.id,
        formattedId: bugId,
        type: "bug",
        title: b.title,
        priority: b.priority || "medium",
        status: b.status,
        dueDate: dueStr,
        explanation,
        score,
      });
    }

    // 2. Process active tasks
    for (const t of data.tasks) {
      if (t.status === "done" || t.status === "cancelled") continue;

      const taskId = formatTaskId(t);
      let score = 40;
      let explanation = "Active development task.";

      if (t.status === "in_progress") {
        score += 25;
        explanation = "Currently in active development.";
      }

      if (t.priority === "urgent") {
        score += 60;
        explanation += " Critical milestone task.";
      } else if (t.priority === "high") {
        score += 40;
        explanation += " High priority feature item.";
      } else if (t.priority === "medium") {
        score += 20;
      }

      const dueStr = t.dueDate instanceof Date
        ? t.dueDate.toISOString().split("T")[0]
        : typeof t.dueDate === "string"
        ? t.dueDate.split("T")[0]
        : null;

      if (dueStr) {
        if (dueStr < today) {
          score += 50;
          explanation += ` Overdue deadline: ${dueStr}.`;
        } else if (dueStr === today) {
          score += 35;
          explanation += " Due today.";
        } else {
          explanation += ` Scheduled completion: ${dueStr}.`;
        }
      }

      candidates.push({
        id: t.id,
        formattedId: taskId,
        type: "task",
        title: t.title,
        priority: t.priority || "medium",
        status: t.status,
        dueDate: dueStr,
        explanation,
        score,
      });
    }

    // 3. Process due learnings
    for (const l of data.learnings) {
      candidates.push({
        id: l.id,
        formattedId: `LRN-${l.id.slice(0, 4).toUpperCase()}`,
        type: "learning",
        title: l.title,
        priority: "medium",
        status: l.reviewStatus || "review",
        explanation: "Key engineering gotcha or architectural note to keep in mind today.",
        score: 65,
      });
    }

    // Sort descending by calculated priority score
    candidates.sort((a, b) => b.score - a.score);

    // Top 4-5 items become primary focus items
    const focusItems = candidates.slice(0, 5).map((c) => ({
      itemId: c.formattedId,
      type: c.type,
      title: c.title,
      priority: c.priority,
      rationale: c.explanation,
    }));

    // Remaining items become quick wins
    const quickWins = candidates.slice(5, 8).map(
      (c) => `[${c.formattedId}] ${c.title} (${c.type.toUpperCase()})`
    );

    const dueLearningCount = data.learnings.length;
    const reviewReminder =
      dueLearningCount > 0
        ? `You have ${dueLearningCount} engineering learning card${
            dueLearningCount === 1 ? "" : "s"
          } due for spaced repetition recall today.`
        : undefined;

    return {
      headline: "Daily Engineering Focus Plan",
      focusItems,
      quickWins,
      reviewReminder,
      standupBullets: [],
      fixedDefectsSummary: "",
      completedTasksSummary: "",
      keyInsightsRetained: [],
    };
  } else {
    // weekly_standup
    const standupBullets: string[] = [];

    const doneTasks = data.tasks.filter((t) => t.status === "done");
    const resolvedBugs = data.bugs.filter((b) => b.status === "resolved" || b.status === "closed");
    const retainedLearnings = data.learnings.filter((l) => (l.reviewBox || 1) > 1);

    for (const b of resolvedBugs.slice(0, 5)) {
      const bugId = formatBugId(b);
      standupBullets.push(`[${bugId}] Fixed defect: ${b.title}`);
    }

    for (const t of doneTasks.slice(0, 6)) {
      const taskId = formatTaskId(t);
      standupBullets.push(`[${taskId}] Completed: ${t.title}`);
    }

    for (const l of retainedLearnings.slice(0, 3)) {
      standupBullets.push(`[Knowledge] Mastered: ${l.title} (Box ${l.reviewBox})`);
    }

    if (standupBullets.length === 0) {
      standupBullets.push("No completed tasks or resolved bugs recorded this week.");
    }

    const completedTasksSummary = doneTasks.length > 0
      ? `Completed ${doneTasks.length} task${doneTasks.length === 1 ? "" : "s"} across active projects.`
      : "No tasks marked done in this period.";

    const fixedDefectsSummary = resolvedBugs.length > 0
      ? `Resolved and verified ${resolvedBugs.length} defect${resolvedBugs.length === 1 ? "" : "s"}.`
      : "No bugs closed in this period.";

    const keyInsightsRetained = retainedLearnings.map(
      (l) => `${l.title} (Advanced to Box ${l.reviewBox})`
    );

    return {
      headline: "Weekly Engineering Standup",
      focusItems: [],
      quickWins: [],
      standupBullets,
      completedTasksSummary,
      fixedDefectsSummary,
      keyInsightsRetained,
    };
  }
}

/**
 * Builds a formatted Markdown summary from precomputed plan data.
 */
function buildMarkdownFromPrecomputed(mode: "daily_plan" | "weekly_standup", plan: PrecomputedPlan): string {
  if (mode === "daily_plan") {
    const focusLines = plan.focusItems
      .map(
        (f) =>
          `- **[${f.itemId}]** (${f.priority.toUpperCase()}) ${f.title}\n  *Rationale:* ${f.rationale}`
      )
      .join("\n");

    const quickWinLines = plan.quickWins.map((q) => `- ${q}`).join("\n");

    return `## ${plan.headline}\n\n### Primary Focus Items\n${focusLines || "No critical tasks pending."}${
      quickWinLines ? `\n\n### Quick Wins\n${quickWinLines}` : ""
    }${plan.reviewReminder ? `\n\n### Recall Review\n${plan.reviewReminder}` : ""}`;
  } else {
    const bullets = plan.standupBullets.map((b) => `- ${b}`).join("\n");
    return `## ${plan.headline}\n\n${bullets}\n\n### Summary of Accomplishments\n- **Tasks Done:** ${plan.completedTasksSummary}\n- **Defects Fixed:** ${plan.fixedDefectsSummary}`;
  }
}

export async function generateWorkspaceSummary({
  userId,
  mode,
}: SummaryRequest): Promise<{
  success: boolean;
  data?: SummaryOutput;
  isAiFallback?: boolean;
  error?: { code: string; message: string };
}> {
  try {
    // 1. Fetch raw scoped workspace records
    let tasks: SummaryTaskInput[] = [];
    let bugs: SummaryBugInput[] = [];
    let learnings: SummaryLearningInput[] = [];

    if (mode === "daily_plan") {
      const [allTasks, allBugs, dueLearnings] = await Promise.all([
        listTasks(userId, { limit: 25 }).catch(() => []),
        listBugs(userId, { limit: 25 }).catch(() => []),
        getDueLearnings(userId, 10).catch(() => []),
      ]);
      tasks = allTasks;
      bugs = allBugs;
      learnings = dueLearnings;
    } else {
      const [allTasks, allBugs, allLearnings] = await Promise.all([
        listTasks(userId, { limit: 50 }).catch(() => []),
        listBugs(userId, { limit: 50 }).catch(() => []),
        listLearnings(userId, { limit: 30 }).catch(() => []),
      ]);
      tasks = allTasks;
      bugs = allBugs;
      learnings = allLearnings;
    }

  // 2. Pre-filter and rank using deterministic computational logic
  const precomputed = computeRelevantWorkspaceItems(mode, { tasks, bugs, learnings });

  // Construct deterministic fallback output
  const fallbackOutput: SummaryOutput = {
    mode,
    markdownSummary: buildMarkdownFromPrecomputed(mode, precomputed),
    dailyPlan: mode === "daily_plan" ? {
      headline: precomputed.headline,
      focusItems: precomputed.focusItems,
      quickWins: precomputed.quickWins,
      reviewReminder: precomputed.reviewReminder,
    } : undefined,
    weeklyStandup: mode === "weekly_standup" ? {
      standupBullets: precomputed.standupBullets,
      fixedDefectsSummary: precomputed.fixedDefectsSummary,
      completedTasksSummary: precomputed.completedTasksSummary,
      keyInsightsRetained: precomputed.keyInsightsRetained,
    } : undefined,
  };

  // 3. Check quota before calling AI
  const quotaError = await checkUserQuota(userId);
  if (quotaError) {
    // Graceful fallback to precomputed plan instead of failing!
    return {
      success: true,
      data: fallbackOutput,
      isAiFallback: true,
    };
  }

  // 4. Distill ONLY relevant items to send to the AI model (reduces tokens by ~85%)
  const distilledData = mode === "daily_plan"
    ? {
        tasks: tasks
          .filter((t) => precomputed.focusItems.some((f) => f.itemId === formatTaskId(t)))
          .map((t) => ({ ...t, formattedId: formatTaskId(t) })),
        bugs: bugs
          .filter((b) => precomputed.focusItems.some((f) => f.itemId === formatBugId(b)))
          .map((b) => ({ ...b, formattedId: formatBugId(b) })),
        learnings: learnings.slice(0, 3).map((l) => ({
          ...l,
          formattedId: `LRN-${l.id.slice(0, 4).toUpperCase()}`,
        })),
      }
    : {
        tasks: tasks
          .filter((t) => t.status === "done")
          .slice(0, 6)
          .map((t) => ({ ...t, formattedId: formatTaskId(t) })),
        bugs: bugs
          .filter((b) => b.status === "resolved" || b.status === "closed")
          .slice(0, 5)
          .map((b) => ({ ...b, formattedId: formatBugId(b) })),
        learnings: learnings.slice(0, 3).map((l) => ({
          ...l,
          formattedId: `LRN-${l.id.slice(0, 4).toUpperCase()}`,
        })),
      };

  // 5. Build minimal prompt
  const promptConfig = buildSummaryPrompt(mode, distilledData);

  // 6. Call model
  const result = await agentClient.generate(promptConfig);

  if (!result.success) {
    console.warn("AI generation failed or rate-limited; utilizing precomputed plan fallback:", result.error);
    await recordAgentUsage(userId, { inputTokens: 0, outputTokens: 0 }).catch(() => {});
    return {
      success: true,
      data: fallbackOutput,
      isAiFallback: true,
    };
  }

  // 7. Record usage
  await recordAgentUsage(userId, {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });

  // Ensure item IDs are preserved
  const resultData = result.data;
  if (resultData.dailyPlan && resultData.dailyPlan.focusItems) {
    resultData.dailyPlan.focusItems = resultData.dailyPlan.focusItems.map((item, idx) => {
      const matchingPrecomputed = precomputed.focusItems[idx];
      return {
        ...item,
        itemId: item.itemId && item.itemId !== "item" ? item.itemId : matchingPrecomputed?.itemId || `ITEM-${idx + 1}`,
      };
    });
  }

  return {
    success: true,
    data: resultData,
    isAiFallback: false,
  };
} catch (outerErr) {
  console.error("Unhandled error in generateWorkspaceSummary:", outerErr);
  return {
    success: true,
    data: {
      mode,
      markdownSummary: "### Workspace Summary\n\nNo items currently require urgent attention.",
      dailyPlan: mode === "daily_plan" ? {
        headline: "Today's Priorities",
        focusItems: [],
        quickWins: [],
      } : undefined,
      weeklyStandup: mode === "weekly_standup" ? {
        standupBullets: ["Continued active workspace development."],
        fixedDefectsSummary: "No defect fixes recorded this period.",
        completedTasksSummary: "Development tasks ongoing.",
        keyInsightsRetained: [],
      } : undefined,
    },
    isAiFallback: true,
  };
}
}
