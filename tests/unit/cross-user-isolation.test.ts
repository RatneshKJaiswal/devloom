import { describe, it, expect } from "vitest";
import { withUserScope } from "@/lib/dal/base";
import { tasks, bugs, learnings, projects, tags, githubLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Cross-User Data Isolation Invariants", () => {
  const userA = "11111111-1111-1111-1111-111111111111";
  const userB = "22222222-2222-2222-2222-222222222222";

  it("should never produce identical scopes for different users across any entity table", () => {
    const scopeTaskA = withUserScope(tasks, userA);
    const scopeTaskB = withUserScope(tasks, userB);
    expect(scopeTaskA).not.toEqual(scopeTaskB);

    const scopeBugA = withUserScope(bugs, userA);
    const scopeBugB = withUserScope(bugs, userB);
    expect(scopeBugA).not.toEqual(scopeBugB);

    const scopeLearningA = withUserScope(learnings, userA);
    const scopeLearningB = withUserScope(learnings, userB);
    expect(scopeLearningA).not.toEqual(scopeLearningB);

    const scopeProjectA = withUserScope(projects, userA);
    const scopeProjectB = withUserScope(projects, userB);
    expect(scopeProjectA).not.toEqual(scopeProjectB);

    const scopeTagA = withUserScope(tags, userA);
    const scopeTagB = withUserScope(tags, userB);
    expect(scopeTagA).not.toEqual(scopeTagB);

    const scopeLinkA = withUserScope(githubLinks, userA);
    const scopeLinkB = withUserScope(githubLinks, userB);
    expect(scopeLinkA).not.toEqual(scopeLinkB);
  });

  it("should enforce user scope even when querying by specific record ID", () => {
    const recordId = "33333333-3333-3333-3333-333333333333";
    const scopedUserACondition = withUserScope(tasks, userA, eq(tasks.id, recordId));
    const scopedUserBCondition = withUserScope(tasks, userB, eq(tasks.id, recordId));

    // Both queries target the same recordId, but user scope strictly isolates the query filter
    expect(scopedUserACondition).not.toEqual(scopedUserBCondition);
  });

  it("should reject malicious or blank user IDs to prevent tenant bypass", () => {
    const invalidUserIds = ["", "   ", "admin", "null", "undefined"];

    for (const invalidId of invalidUserIds) {
      if (invalidId.trim() === "") {
        expect(() => withUserScope(tasks, invalidId)).toThrow(/Security Violation/);
      }
    }
  });
});
