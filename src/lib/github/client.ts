import { ParsedGitHubUrl } from "./parser";

const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubMetadata {
  title: string;
  state: "open" | "closed" | "merged";
  body?: string;
  author?: string;
  labels?: string[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  htmlUrl: string;
  isPrivate: boolean;
  language?: string;
  updatedAt: string;
}

/**
 * Fetches the authenticated user's repositories from the GitHub REST API.
 */
export async function fetchUserRepositories(
  accessToken: string
): Promise<GitHubRepository[]> {
  const endpoint = `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevLoom-App",
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const res = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`Failed to fetch user repositories from GitHub [${res.status}]`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || undefined,
      htmlUrl: repo.html_url,
      isPrivate: repo.private,
      language: repo.language || undefined,
      updatedAt: repo.updated_at,
    }));
  } catch (err) {
    console.error("Error fetching user repositories from GitHub:", err);
    return [];
  }
}

/**
 * Fetches real-time metadata from the GitHub REST API for an issue or pull request.
 */
export async function fetchGitHubMetadata(
  parsed: ParsedGitHubUrl,
  accessToken?: string | null
): Promise<GitHubMetadata | null> {
  if (parsed.linkType !== "issue" && parsed.linkType !== "pull_request") {
    // For file links, synthesize metadata from file path
    return {
      title: parsed.filePath || `${parsed.repoOwner}/${parsed.repoName}`,
      state: "open",
    };
  }

  const endpoint = `${GITHUB_API_BASE}/repos/${parsed.repoOwner}/${parsed.repoName}/issues/${parsed.issueOrPrNumber}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevLoom-App",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`GitHub API request failed [${res.status}]: ${endpoint}`);
      return null;
    }

    const data = await res.json();

    let state: "open" | "closed" | "merged" = data.state === "closed" ? "closed" : "open";
    if (data.pull_request?.merged_at) {
      state = "merged";
    }

    const labels = Array.isArray(data.labels)
      ? data.labels.map((l: any) => (typeof l === "string" ? l : l.name)).filter(Boolean)
      : [];

    return {
      title: data.title || `Issue #${parsed.issueOrPrNumber}`,
      state,
      body: data.body || "",
      author: data.user?.login,
      labels,
    };
  } catch (err) {
    console.warn("Failed to contact GitHub API:", err);
    return null;
  }
}

/**
 * Fetches file snippet content from GitHub.
 */
export async function fetchGitHubFileContent(
  parsed: ParsedGitHubUrl,
  accessToken?: string | null
): Promise<string | null> {
  if (parsed.linkType !== "file" || !parsed.filePath) {
    return null;
  }

  const endpoint = `${GITHUB_API_BASE}/repos/${parsed.repoOwner}/${parsed.repoName}/contents/${parsed.filePath}${
    parsed.branch ? `?ref=${encodeURIComponent(parsed.branch)}` : ""
  }`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevLoom-App",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.encoding === "base64" && data.content) {
      const decoded = Buffer.from(data.content, "base64").toString("utf8");
      // Truncate to max 4000 chars to avoid memory bloat
      return decoded.slice(0, 4000);
    }

    return null;
  } catch (err) {
    console.warn("Failed to fetch file content from GitHub:", err);
    return null;
  }
}

export interface GitHubCommitItem {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
  htmlUrl: string;
}

export interface GitHubIssueItem {
  id: number;
  number: number;
  title: string;
  body?: string;
  author: string;
  authorAvatar?: string;
  labels: string[];
  state: "open" | "closed";
  isPullRequest: boolean;
  createdAt: string;
  htmlUrl: string;
}

/**
 * Fetches recent repository commits from GitHub API.
 */
export async function fetchGitHubCommits(
  repoOwner: string,
  repoName: string,
  accessToken?: string | null,
  perPage = 20
): Promise<GitHubCommitItem[]> {
  const endpoint = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/commits?per_page=${perPage}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevLoom-App",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`Failed to fetch commits for ${repoOwner}/${repoName} [${res.status}]`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const fullMessage = item.commit?.message || "No commit message";
      const firstLine = fullMessage.split("\n")[0];

      return {
        sha: item.sha,
        shortSha: item.sha ? item.sha.slice(0, 7) : "",
        message: firstLine,
        author: item.author?.login || item.commit?.author?.name || "Unknown",
        authorAvatar: item.author?.avatar_url,
        date: item.commit?.author?.date || new Date().toISOString(),
        htmlUrl: item.html_url || `https://github.com/${repoOwner}/${repoName}/commit/${item.sha}`,
      };
    });
  } catch (err) {
    console.error("Error fetching GitHub commits:", err);
    return [];
  }
}

/**
 * Fetches open issues and pull requests for a repository from GitHub API.
 */
export async function fetchGitHubOpenIssues(
  repoOwner: string,
  repoName: string,
  accessToken?: string | null,
  perPage = 30
): Promise<GitHubIssueItem[]> {
  const endpoint = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/issues?state=open&per_page=${perPage}&sort=updated`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevLoom-App",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`Failed to fetch issues for ${repoOwner}/${repoName} [${res.status}]`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const labels = Array.isArray(item.labels)
        ? item.labels.map((l: any) => (typeof l === "string" ? l : l.name)).filter(Boolean)
        : [];

      return {
        id: item.id,
        number: item.number,
        title: item.title,
        body: item.body || "",
        author: item.user?.login || "Unknown",
        authorAvatar: item.user?.avatar_url,
        labels,
        state: item.state || "open",
        isPullRequest: !!item.pull_request,
        createdAt: item.created_at,
        htmlUrl: item.html_url,
      };
    });
  } catch (err) {
    console.error("Error fetching GitHub open issues:", err);
    return [];
  }
}
