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
