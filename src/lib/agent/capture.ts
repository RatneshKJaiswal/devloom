import { listProjects, listTags } from "@/lib/dal/organization";
import { createTask } from "@/lib/dal/tasks";
import { createBug } from "@/lib/dal/bugs";
import { createLearning } from "@/lib/dal/learnings";
import { checkInputSize, checkUserQuota, recordAgentUsage } from "./quota";
import { buildSmartCapturePrompt, SmartCaptureOutput } from "./prompts/capture";
import { agentClient } from "./client";
import { AgentResult } from "./types";

export interface SmartCaptureRequest {
  userId: string;
  rawInput: string;
  autoSave?: boolean;
}

export type SmartCaptureResponse =
  | { success: true; candidate: SmartCaptureOutput; savedRecord?: any; usage: { inputTokens: number; outputTokens: number } }
  | { success: false; error: { code: string; message: string; retryable: boolean } };

export async function processSmartCapture({
  userId,
  rawInput,
  autoSave = false,
}: SmartCaptureRequest): Promise<SmartCaptureResponse> {
  // 1. Validate input size
  const sizeError = checkInputSize(rawInput);
  if (sizeError) {
    return { success: false, error: sizeError };
  }

  // 2. Enforce per-user quota and global spending limits
  const quotaError = await checkUserQuota(userId);
  if (quotaError) {
    return { success: false, error: quotaError };
  }

  // 3. Fetch user context (projects & tags) to assist the agent in matching
  const [userProjects, userTags] = await Promise.all([
    listProjects(userId),
    listTags(userId),
  ]);

  const projectNames = userProjects.map((p) => p.name);
  const tagNames = userTags.map((t) => t.name);

  // 4. Construct prompt with prompt injection containment
  const promptConfig = buildSmartCapturePrompt(rawInput, projectNames, tagNames);

  // 5. Generate structured output
  const result: AgentResult<SmartCaptureOutput> = await agentClient.generate(promptConfig);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const candidate = result.data;

  // 6. Record usage metrics (tokens & estimated cost)
  await recordAgentUsage(userId, {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });

  // 7. Auto-save if requested
  let savedRecord: any = null;
  if (autoSave) {
    // Resolve project ID if suggested name matches
    const matchedProject = userProjects.find(
      (p) => p.name.toLowerCase() === candidate.suggestedProjectName?.toLowerCase()
    );
    const projectId = matchedProject ? matchedProject.id : null;

    if (candidate.entityType === "task") {
      savedRecord = await createTask(userId, {
        title: candidate.title,
        description: candidate.description,
        priority: candidate.priority,
        projectId,
      });
    } else if (candidate.entityType === "bug") {
      savedRecord = await createBug(userId, {
        title: candidate.title,
        description: candidate.description,
        priority: candidate.priority,
        projectId,
        stackTrace: candidate.bugDetails?.stackTrace,
        reproSteps: candidate.bugDetails?.reproSteps,
        suspectedCause: candidate.bugDetails?.suspectedCause,
      });
    } else if (candidate.entityType === "learning") {
      savedRecord = await createLearning(userId, {
        title: candidate.title,
        content: candidate.description || candidate.title,
        projectId,
      });
    }
  }

  return {
    success: true,
    candidate,
    savedRecord,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    },
  };
}
