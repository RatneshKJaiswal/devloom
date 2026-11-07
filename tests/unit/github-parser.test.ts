import { describe, it, expect } from "vitest";
import { parseGitHubUrl } from "@/lib/github/parser";

describe("GitHub URL Parser", () => {
  it("should parse an issue URL correctly", () => {
    const url = "https://github.com/facebook/react/issues/28000";
    const result = parseGitHubUrl(url);

    expect(result).not.toBeNull();
    expect(result?.linkType).toBe("issue");
    expect(result?.repoOwner).toBe("facebook");
    expect(result?.repoName).toBe("react");
    expect(result?.issueOrPrNumber).toBe(28000);
  });

  it("should parse a pull request URL correctly", () => {
    const url = "https://github.com/vercel/next.js/pull/62000";
    const result = parseGitHubUrl(url);

    expect(result).not.toBeNull();
    expect(result?.linkType).toBe("pull_request");
    expect(result?.repoOwner).toBe("vercel");
    expect(result?.repoName).toBe("next.js");
    expect(result?.issueOrPrNumber).toBe(62000);
  });

  it("should parse a file URL with line numbers correctly", () => {
    const url = "https://github.com/drizzle-team/drizzle-orm/blob/main/src/pg-core/table.ts#L15-L30";
    const result = parseGitHubUrl(url);

    expect(result).not.toBeNull();
    expect(result?.linkType).toBe("file");
    expect(result?.repoOwner).toBe("drizzle-team");
    expect(result?.repoName).toBe("drizzle-orm");
    expect(result?.branch).toBe("main");
    expect(result?.filePath).toBe("src/pg-core/table.ts");
    expect(result?.lineStart).toBe(15);
    expect(result?.lineEnd).toBe(30);
  });

  it("should reject invalid non-GitHub URLs", () => {
    expect(parseGitHubUrl("https://gitlab.com/owner/repo/issues/1")).toBeNull();
    expect(parseGitHubUrl("https://example.com/not-a-repo")).toBeNull();
    expect(parseGitHubUrl("not a url")).toBeNull();
  });
});
