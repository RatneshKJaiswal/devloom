import { db } from "@/lib/db";
import { agentUsage } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { AgentError } from "./types";

export const MAX_INPUT_CHARACTERS = 8000;
const DEFAULT_DAILY_REQUEST_LIMIT = 50;
const DEFAULT_DAILY_TOKEN_LIMIT = 100000;

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export function checkInputSize(input: string): AgentError | null {
  if (input.length > MAX_INPUT_CHARACTERS) {
    return {
      code: "INPUT_TOO_LARGE",
      message: `Pasted text exceeds maximum allowed size of ${MAX_INPUT_CHARACTERS} characters (received ${input.length}). Please shorten the input.`,
      retryable: false,
    };
  }
  return null;
}

/**
 * Checks whether the user or global system has exhausted daily quota limits.
 */
export async function checkUserQuota(userId: string): Promise<AgentError | null> {
  const today = getTodayDateString();
  const maxRequests = parseInt(
    process.env.AGENT_DAILY_REQUEST_LIMIT || String(DEFAULT_DAILY_REQUEST_LIMIT),
    10
  );
  const maxTokens = parseInt(
    process.env.AGENT_DAILY_TOKEN_LIMIT || String(DEFAULT_DAILY_TOKEN_LIMIT),
    10
  );

  // Retrieve today's record for this user
  const [record] = await db
    .select({
      requestCount: agentUsage.requestCount,
      inputTokens: agentUsage.inputTokens,
      outputTokens: agentUsage.outputTokens,
    })
    .from(agentUsage)
    .where(and(eq(agentUsage.userId, userId), eq(agentUsage.usageDate, today)))
    .limit(1);

  if (record) {
    if (record.requestCount >= maxRequests) {
      return {
        code: "QUOTA_EXCEEDED",
        message: `You have reached your daily limit of ${maxRequests} AI operations. Quota resets at 00:00 UTC.`,
        retryable: false,
      };
    }

    const totalTokens = record.inputTokens + record.outputTokens;
    if (totalTokens >= maxTokens) {
      return {
        code: "QUOTA_EXCEEDED",
        message: `You have reached your daily AI token limit (${totalTokens.toLocaleString()} / ${maxTokens.toLocaleString()}). Quota resets at 00:00 UTC.`,
        retryable: false,
      };
    }
  }

  // Global spending safety check
  const globalBudgetLimitCents = parseInt(
    process.env.MAX_DAILY_GLOBAL_AGENT_BUDGET_CENTS || "500",
    10
  );

  const [globalSum] = await db
    .select({
      totalCostMicros: sql<number>`coalesce(sum(${agentUsage.estimatedCostMicros}), 0)`,
    })
    .from(agentUsage)
    .where(eq(agentUsage.usageDate, today));

  const totalCostCents = (Number(globalSum?.totalCostMicros || 0) / 1000000) * 100;
  if (totalCostCents >= globalBudgetLimitCents) {
    return {
      code: "GLOBAL_BUDGET_EXCEEDED",
      message: "The global AI daily budget has been reached for today. Standard manual tracker features remain fully functional.",
      retryable: false,
    };
  }

  return null;
}

/**
 * Records token usage and approximate cost after a successful agent call.
 * NEVER logs prompts or user content.
 */
export async function recordAgentUsage(
  userId: string,
  usage: { inputTokens: number; outputTokens: number }
): Promise<void> {
  const today = getTodayDateString();

  // Gemini 1.5 Flash / 2.0 Flash pricing approx:
  // $0.10 / 1M input tokens = $0.0000001 / token = 0.1 micros / token
  // $0.40 / 1M output tokens = $0.0000004 / token = 0.4 micros / token
  const costMicros = Math.round(
    usage.inputTokens * 0.1 + usage.outputTokens * 0.4
  );

  await db
    .insert(agentUsage)
    .values({
      userId,
      usageDate: today,
      requestCount: 1,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCostMicros: costMicros,
    })
    .onConflictDoUpdate({
      target: [agentUsage.userId, agentUsage.usageDate],
      set: {
        requestCount: sql`${agentUsage.requestCount} + 1`,
        inputTokens: sql`${agentUsage.inputTokens} + ${usage.inputTokens}`,
        outputTokens: sql`${agentUsage.outputTokens} + ${usage.outputTokens}`,
        estimatedCostMicros: sql`${agentUsage.estimatedCostMicros} + ${costMicros}`,
        updatedAt: new Date(),
      },
    });
}
