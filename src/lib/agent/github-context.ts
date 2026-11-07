import { parseGitHubUrl } from "@/lib/github/parser";
import { fetchGitHubMetadata } from "@/lib/github/client";
import { getUserGitHubToken } from "@/lib/security/tokens";
import { checkUserQuota, recordAgentUsage } from "./quota";
import { buildGitHubContextPrompt, GitHubContextOutput } from "./prompts/github";
import { agentClient } from "./client";
import { createTask } from "@/lib/dal/tasks";
import { createBug } from "@/lib/dal/bugs";
import { createLearning } from "@/lib/dal/learnings";
import { linkItemToGitHub } from "@/lib/dal/links";

export interface GitHubContextRequest {
  userId: string;
  githubUrl: string;
}

export type GitHubContextResponse =
  | { success: true; candidate: GitHubContextOutput; createdItem: any; gitHubLink: any }
  | { success: false; error: { code: string; message: string; retryable: boolean } };

export async function processGitHubContext({
  userId,
  githubUrl,
}: GitHubContextRequest): Promise<GitHubContextResponse> {
  // 1. Parse GitHub URL
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed || (parsed.linkType !== "issue" && parsed.linkType !== "pull_request")) {
    return {
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Please provide a valid GitHub issue or pull request URL.",
        retryable: false,
      },
    };
  }

  // 2. Check quota
  const quotaError = await checkUserQuota(userId);
  if (quotaError) {
    return { success: false, error: quotaError };
  }

  // 3. Fetch GitHub issue/PR details using user's OAuth token
  const token = await getUserGitHubToken(userId);
  const metadata = await fetchGitHubMetadata(parsed, token);

  if (!metadata) {
    return {
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: `Could not fetch GitHub item from ${parsed.repoOwner}/${parsed.repoName}. Check if repository is private and token permissions are granted.`,
        retryable: true,
      },
    };
  }

  // 4. Construct prompt with prompt injection containment
  const promptConfig = buildGitHubContextPrompt(parsed, metadata);

  // 5. Call Gemini
  const agentResult = await agentClient.generate(promptConfig);
  if (!agentResult.success) {
    return { success: false, error: agentResult.error };
  }

  const candidate = agentResult.data;

  // 6. Record usage metrics
  await recordAgentUsage(userId, {
    inputTokens: agentResult.usage.inputTokens,
    outputTokens: agentResult.usage.outputTokens,
  });

  // 7. Create item inside workspace
  let createdItem: any = null;
  if (candidate.entityType === "bug") {
    createdItem = await createBug(userId, {
      title: candidate.title,
      description: candidate.description,
      priority: candidate.priority,
      stackTrace: candidate.bugDetails?.stackTrace,
      reproSteps: candidate.bugDetails?.reproSteps,
      suspectedCause: candidate.bugDetails?.suspectedCause,
    });
  } else if (candidate.entityType === "learning") {
    createdItem = await createLearning(userId, {
      title: candidate.title,
      content: candidate.description || candidate.title,
    });
  } else {
    createdItem = await createTask(userId, {
      title: candidate.title,
      description: candidate.description,
      priority: candidate.priority,
    });
  }

  // 8. Link to GitHub
  const gitHubLink = await linkItemToGitHub(userId, {
    entityType: candidate.entityType,
    entityId: createdItem.id,
    url: parsed.url,
  });

  return {
    success: true,
    candidate,
    createdItem,
    gitHubLink,
  };
}
