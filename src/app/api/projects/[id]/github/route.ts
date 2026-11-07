import { auth } from "@/lib/auth/config";
import { getProjectById } from "@/lib/dal/organization";
import { listTasks } from "@/lib/dal/tasks";
import { listBugs } from "@/lib/dal/bugs";
import { listGitHubLinks, linkItemToGitHub, findExistingGitHubLink } from "@/lib/dal/links";
import { getUserGitHubToken } from "@/lib/security/tokens";
import { fetchGitHubCommits, fetchGitHubOpenIssues, fetchUserRepositories } from "@/lib/github/client";
import { parseGitHubUrl } from "@/lib/github/parser";
import { createTask } from "@/lib/dal/tasks";
import { createBug } from "@/lib/dal/bugs";
import {
  badRequestResponse,
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id: projectId } = await params;
    const project = await getProjectById(session.user.id, projectId);
    if (!project) return notFoundResponse("Project not found");

    // 1. Detect GitHub repository for this project
    let repoOwner: string | null = null;
    let repoName: string | null = null;

    // Check project description for "owner/repo" or github.com url
    const desc = project.description || "";
    const urlMatch = desc.match(/github\.com\/([^/\s]+)\/([^/\s]+)/i);
    const repoMatch = desc.match(/GitHub repository:\s*([^/\s]+)\/([^/\s]+)/i);

    if (urlMatch) {
      repoOwner = urlMatch[1];
      repoName = urlMatch[2].replace(/\.git$/, "");
    } else if (repoMatch) {
      repoOwner = repoMatch[1];
      repoName = repoMatch[2].replace(/\.git$/, "");
    }

    // If not found in description, inspect linked tasks and bugs in this project
    if (!repoOwner || !repoName) {
      const [projectTasks, projectBugs] = await Promise.all([
        listTasks(session.user.id, { projectId }),
        listBugs(session.user.id, { projectId }),
      ]);

      for (const t of projectTasks) {
        if (t.githubLinks && t.githubLinks.length > 0) {
          repoOwner = t.githubLinks[0].repoOwner;
          repoName = t.githubLinks[0].repoName;
          break;
        }
      }

      if (!repoOwner || !repoName) {
        for (const b of projectBugs) {
          if (b.githubLinks && b.githubLinks.length > 0) {
            repoOwner = b.githubLinks[0].repoOwner;
            repoName = b.githubLinks[0].repoName;
            break;
          }
        }
      }
    }

    const token = await getUserGitHubToken(session.user.id);

    // If still not found, check if project name matches any user repository on GitHub
    if ((!repoOwner || !repoName) && token) {
      const userRepos = await fetchUserRepositories(token);
      const matched = userRepos.find(
        (r) => r.name.toLowerCase() === project.name.toLowerCase()
      );
      if (matched) {
        const [owner, name] = matched.fullName.split("/");
        repoOwner = owner;
        repoName = name;
      }
    }

    if (!repoOwner || !repoName) {
      return jsonResponse({
        connected: false,
        message: "No GitHub repository associated with this project.",
      });
    }

    // 2. Fetch commits and open issues in parallel
    const [commits, issues, allUserLinks] = await Promise.all([
      fetchGitHubCommits(repoOwner, repoName, token, 15),
      fetchGitHubOpenIssues(repoOwner, repoName, token, 30),
      listGitHubLinks(session.user.id),
    ]);

    // Build lookup of already imported issue numbers
    const importedMap = new Map<number, { entityType: string; entityId: string }>();
    for (const link of allUserLinks) {
      if (
        link.issueOrPrNumber &&
        link.repoOwner?.toLowerCase() === repoOwner.toLowerCase() &&
        link.repoName?.toLowerCase() === repoName.toLowerCase()
      ) {
        importedMap.set(link.issueOrPrNumber, {
          entityType: link.entityType,
          entityId: link.entityId,
        });
      }
    }

    const annotatedIssues = issues.map((iss) => {
      const importedInfo = importedMap.get(iss.number);
      return {
        ...iss,
        alreadyImported: !!importedInfo,
        importedAs: importedInfo?.entityType || null,
        importedEntityId: importedInfo?.entityId || null,
      };
    });

    return jsonResponse({
      connected: true,
      repoOwner,
      repoName,
      fullName: `${repoOwner}/${repoName}`,
      commits,
      issues: annotatedIssues,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

const addIssueSchema = z.object({
  issueNumber: z.number(),
  entityType: z.enum(["task", "bug"]),
  title: z.string().min(1),
  body: z.string().optional(),
  htmlUrl: z.string().url(),
  labels: z.array(z.string()).optional(),
});

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id: projectId } = await params;
    const project = await getProjectById(session.user.id, projectId);
    if (!project) return notFoundResponse("Project not found");

    const body = await req.json();
    const parsed = addIssueSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { issueNumber, entityType, title, body: issueBody, htmlUrl, labels } = parsed.data;

    // Parse URL to check duplicate
    const parsedUrl = parseGitHubUrl(htmlUrl);
    if (parsedUrl) {
      const existing = await findExistingGitHubLink(session.user.id, parsedUrl);
      if (existing) {
        return jsonResponse(
          {
            error: `This issue (#${issueNumber}) has already been imported as a ${existing.entityType}.`,
            alreadyExists: true,
          },
          409
        );
      }
    }

    let formattedDescription = (issueBody || "").replace(/\\n/g, "\n").trim();
    const refBlock = [
      `\n\n### 🔗 GitHub Context`,
      `- **Issue:** [#${issueNumber}](${htmlUrl})`,
      labels && labels.length > 0 ? `- **Labels:** ${labels.join(", ")}` : null,
      `- **Project:** ${project.name}`,
    ].filter(Boolean).join("\n");

    formattedDescription = `${formattedDescription}${refBlock}`.trim();

    let createdItem: any;
    if (entityType === "bug") {
      createdItem = await createBug(session.user.id, {
        title,
        description: formattedDescription,
        projectId,
        priority: labels?.some((l) => l.toLowerCase().includes("urgent") || l.toLowerCase().includes("critical"))
          ? "urgent"
          : labels?.some((l) => l.toLowerCase().includes("high"))
          ? "high"
          : "medium",
      });
    } else {
      createdItem = await createTask(session.user.id, {
        title,
        description: formattedDescription,
        projectId,
        priority: labels?.some((l) => l.toLowerCase().includes("urgent") || l.toLowerCase().includes("critical"))
          ? "urgent"
          : labels?.some((l) => l.toLowerCase().includes("high"))
          ? "high"
          : "medium",
      });
    }

    // Link in github_links
    const gitHubLink = await linkItemToGitHub(session.user.id, {
      entityType,
      entityId: createdItem.id,
      url: htmlUrl,
    });

    return jsonResponse(
      {
        success: true,
        createdItem,
        gitHubLink,
        message: `Successfully imported Issue #${issueNumber} as a ${entityType} in ${project.name}!`,
      },
      201
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
