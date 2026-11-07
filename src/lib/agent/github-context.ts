import { parseGitHubUrl } from "@/lib/github/parser";
import { fetchGitHubMetadata } from "@/lib/github/client";
import { getUserGitHubToken } from "@/lib/security/tokens";
import { checkUserQuota, recordAgentUsage } from "./quota";
import { buildGitHubContextPrompt, GitHubContextOutput } from "./prompts/github";
import { agentClient } from "./client";
import { createTask } from "@/lib/dal/tasks";
import { createBug } from "@/lib/dal/bugs";
import { createLearning } from "@/lib/dal/learnings";
import { linkItemToGitHub, findExistingGitHubLink } from "@/lib/dal/links";
import { findOrCreateProjectByName } from "@/lib/dal/organization";

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

  // 2. Check for duplicate import (Already exists)
  const existingLink = await findExistingGitHubLink(userId, parsed);
  if (existingLink) {
    const itemType = existingLink.entityType;
    return {
      success: false,
      error: {
        code: "ALREADY_EXISTS",
        message: `Already exists: GitHub ${parsed.linkType === "pull_request" ? "PR" : "issue"} #${parsed.issueOrPrNumber} in ${parsed.repoName} is already imported as a ${itemType}.`,
        retryable: false,
      },
    };
  }

  // 3. Check quota
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

  // 7. Format description & include GitHub context
  let formattedDescription = (candidate.description || "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  const githubRefBlock = [
    `\n\n### 🔗 GitHub Context`,
    `- **Repository:** [${parsed.repoOwner}/${parsed.repoName}](https://github.com/${parsed.repoOwner}/${parsed.repoName})`,
    `- **${parsed.linkType === "pull_request" ? "Pull Request" : "Issue"}:** [#${parsed.issueOrPrNumber}](${parsed.url}) (${metadata.state.toUpperCase()})`,
    metadata.author ? `- **Author:** @${metadata.author}` : null,
    metadata.labels && metadata.labels.length > 0 ? `- **Labels:** ${metadata.labels.join(", ")}` : null,
  ].filter(Boolean).join("\n");

  if (!formattedDescription.includes(parsed.url)) {
    formattedDescription = `${formattedDescription}${githubRefBlock}`.trim();
  }

  // 8. Find or import repository project
  const project = await findOrCreateProjectByName(
    userId,
    parsed.repoName,
    `Project imported from GitHub repository: ${parsed.repoOwner}/${parsed.repoName}`
  );

  // 9. Create item inside workspace
  let createdItem: any = null;
  if (candidate.entityType === "bug") {
    createdItem = await createBug(userId, {
      title: candidate.title,
      description: formattedDescription,
      priority: candidate.priority,
      projectId: project.id,
      stackTrace: candidate.bugDetails?.stackTrace,
      reproSteps: candidate.bugDetails?.reproSteps,
      suspectedCause: candidate.bugDetails?.suspectedCause,
    });
  } else if (candidate.entityType === "learning") {
    createdItem = await createLearning(userId, {
      title: candidate.title,
      content: formattedDescription || candidate.title,
      projectId: project.id,
    });
  } else {
    createdItem = await createTask(userId, {
      title: candidate.title,
      description: formattedDescription,
      priority: candidate.priority,
      projectId: project.id,
    });
  }

  // 9. Link to GitHub
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
