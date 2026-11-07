import { searchAcrossEntities } from "@/lib/dal/search";
import { getTaskById, updateTask, deleteTask } from "@/lib/dal/tasks";
import { getBugById, updateBug, deleteBug } from "@/lib/dal/bugs";
import { getLearningById, updateLearning, deleteLearning } from "@/lib/dal/learnings";
import { checkUserQuota, recordAgentUsage } from "./quota";
import { buildDuplicateDetectionPrompt, CandidateItem, DuplicateDetectionOutput } from "./prompts/duplicates";
import { agentClient } from "./client";

export interface DuplicateDetectionRequest {
  userId: string;
  item: {
    id?: string;
    title: string;
    description?: string;
    type: "task" | "bug" | "learning";
  };
}

export async function detectDuplicates({
  userId,
  item,
}: DuplicateDetectionRequest): Promise<{
  success: boolean;
  data?: DuplicateDetectionOutput;
  error?: { code: string; message: string };
}> {
  // 1. Check quota
  const quotaError = await checkUserQuota(userId);
  if (quotaError) {
    return { success: false, error: quotaError };
  }

  // 2. Lexical candidate search: extract key words from title
  const searchKeywords = item.title
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(" ");

  const searchResults = await searchAcrossEntities(
    userId,
    searchKeywords || item.title,
    10
  );

  // Filter out the item itself if checking an existing record
  const candidates: CandidateItem[] = searchResults
    .filter((r) => r.id !== item.id)
    .map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.preview,
      status: r.status,
    }));

  // Cost optimization: if zero candidate items exist in user's workspace, return early
  if (candidates.length === 0) {
    return {
      success: true,
      data: {
        hasDuplicates: false,
        matches: [],
        summary: "No similar items found in workspace.",
      },
    };
  }

  // 3. Prompt building & injection defense
  const promptConfig = buildDuplicateDetectionPrompt(item, candidates);

  // 4. Generate with Gemini
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

export interface MergeConfirmationRequest {
  userId: string;
  entityType: "task" | "bug" | "learning";
  primaryId: string;
  duplicateId: string;
  confirmed: boolean;
}

/**
 * Executes a merge after explicit user confirmation (Destructive Action Guard).
 */
export async function executeConfirmedMerge({
  userId,
  entityType,
  primaryId,
  duplicateId,
  confirmed,
}: MergeConfirmationRequest) {
  if (!confirmed) {
    throw new Error("Explicit user confirmation is required to merge and delete duplicate records.");
  }

  if (entityType === "task") {
    const [primary, duplicate] = await Promise.all([
      getTaskById(userId, primaryId),
      getTaskById(userId, duplicateId),
    ]);

    if (!primary || !duplicate) throw new Error("One or both tasks not found.");

    const mergedDescription = `${primary.description || ""}\n\n--- Merged duplicate: ${duplicate.title} ---\n${duplicate.description || ""}`.trim();
    await updateTask(userId, primaryId, { description: mergedDescription });
    await deleteTask(userId, duplicateId);
    return getTaskById(userId, primaryId);
  }

  if (entityType === "bug") {
    const [primary, duplicate] = await Promise.all([
      getBugById(userId, primaryId),
      getBugById(userId, duplicateId),
    ]);

    if (!primary || !duplicate) throw new Error("One or both bugs not found.");

    const mergedDescription = `${primary.description || ""}\n\n--- Merged duplicate: ${duplicate.title} ---\n${duplicate.description || ""}`.trim();
    const mergedStackTrace = [primary.stackTrace, duplicate.stackTrace].filter(Boolean).join("\n\n--- Additional Stack Trace ---\n");

    await updateBug(userId, primaryId, {
      description: mergedDescription,
      stackTrace: mergedStackTrace || undefined,
    });
    await deleteBug(userId, duplicateId);
    return getBugById(userId, primaryId);
  }

  if (entityType === "learning") {
    const [primary, duplicate] = await Promise.all([
      getLearningById(userId, primaryId),
      getLearningById(userId, duplicateId),
    ]);

    if (!primary || !duplicate) throw new Error("One or both learnings not found.");

    const mergedContent = `${primary.content}\n\n--- Merged note: ${duplicate.title} ---\n${duplicate.content}`.trim();
    await updateLearning(userId, primaryId, { content: mergedContent });
    await deleteLearning(userId, duplicateId);
    return getLearningById(userId, primaryId);
  }

  throw new Error("Invalid entity type for merge.");
}
