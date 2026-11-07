import { listTasks } from "@/lib/dal/tasks";
import { listBugs } from "@/lib/dal/bugs";
import { listLearnings, getDueLearnings } from "@/lib/dal/learnings";
import { checkUserQuota, recordAgentUsage } from "./quota";
import { buildSummaryPrompt, SummaryOutput } from "./prompts/summary";
import { agentClient } from "./client";

export interface SummaryRequest {
  userId: string;
  mode: "daily_plan" | "weekly_standup";
}

export async function generateWorkspaceSummary({
  userId,
  mode,
}: SummaryRequest): Promise<{
  success: boolean;
  data?: SummaryOutput;
  error?: { code: string; message: string };
}> {
  // 1. Check quota
  const quotaError = await checkUserQuota(userId);
  if (quotaError) {
    return { success: false, error: quotaError };
  }

  // 2. Fetch scoped user data based on mode
  let tasks: any[] = [];
  let bugs: any[] = [];
  let learnings: any[] = [];

  if (mode === "daily_plan") {
    const [allTasks, allBugs, dueLearnings] = await Promise.all([
      listTasks(userId, { limit: 25 }),
      listBugs(userId, { limit: 25 }),
      getDueLearnings(userId, 10),
    ]);

    tasks = allTasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
    bugs = allBugs.filter((b) => b.status !== "resolved" && b.status !== "closed");
    learnings = dueLearnings;
  } else {
    // weekly_standup
    const [allTasks, allBugs, allLearnings] = await Promise.all([
      listTasks(userId, { limit: 50 }),
      listBugs(userId, { limit: 50 }),
      listLearnings(userId, { limit: 30 }),
    ]);

    tasks = allTasks.filter((t) => t.status === "done");
    bugs = allBugs.filter((b) => b.status === "resolved" || b.status === "closed");
    learnings = allLearnings.filter((l) => l.reviewBox > 1);
  }

  // 3. Prompt building & injection defense
  const promptConfig = buildSummaryPrompt(mode, { tasks, bugs, learnings });

  // 4. Call Gemini
  const result = await agentClient.generate(promptConfig);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 5. Record usage
  await recordAgentUsage(userId, {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });

  return {
    success: true,
    data: result.data,
  };
}
