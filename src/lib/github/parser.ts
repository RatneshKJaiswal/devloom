export type GitHubLinkType = "issue" | "pull_request" | "file";

export interface ParsedGitHubUrl {
  url: string;
  repoOwner: string;
  repoName: string;
  linkType: GitHubLinkType;
  issueOrPrNumber?: number;
  filePath?: string;
  branch?: string;
  lineStart?: number;
  lineEnd?: number;
}

/**
 * Parses any GitHub URL (issue, pull request, or file) into structured components.
 * Returns null if the URL is not a valid GitHub link.
 */
export function parseGitHubUrl(rawUrl: string): ParsedGitHubUrl | null {
  try {
    const trimmed = rawUrl.trim();
    const parsed = new URL(trimmed);

    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;

    const [repoOwner, repoName, resourceType, ...rest] = segments;

    // Issue: /:owner/:repo/issues/:number
    if (resourceType === "issues" && rest.length >= 1) {
      const issueNumber = parseInt(rest[0], 10);
      if (isNaN(issueNumber)) return null;

      return {
        url: trimmed,
        repoOwner,
        repoName,
        linkType: "issue",
        issueOrPrNumber: issueNumber,
      };
    }

    // Pull Request: /:owner/:repo/pull/:number
    if (resourceType === "pull" && rest.length >= 1) {
      const prNumber = parseInt(rest[0], 10);
      if (isNaN(prNumber)) return null;

      return {
        url: trimmed,
        repoOwner,
        repoName,
        linkType: "pull_request",
        issueOrPrNumber: prNumber,
      };
    }

    // File: /:owner/:repo/blob/:branch/:path...
    if (resourceType === "blob" && rest.length >= 2) {
      const [branch, ...pathSegments] = rest;
      const filePath = pathSegments.join("/");

      let lineStart: number | undefined;
      let lineEnd: number | undefined;

      if (parsed.hash) {
        const hashMatch = parsed.hash.match(/^#L(\d+)(?:-L(\d+))?$/);
        if (hashMatch) {
          lineStart = parseInt(hashMatch[1], 10);
          lineEnd = hashMatch[2] ? parseInt(hashMatch[2], 10) : lineStart;
        }
      }

      return {
        url: trimmed,
        repoOwner,
        repoName,
        linkType: "file",
        branch,
        filePath,
        lineStart,
        lineEnd,
      };
    }

    return null;
  } catch {
    return null;
  }
}
