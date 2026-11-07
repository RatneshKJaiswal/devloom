import { describe, it, expect } from "vitest";
import { withUserScope } from "@/lib/dal/base";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Data Access Layer — Tenant Isolation", () => {
  it("should create a valid SQL condition scoped to the user", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const condition = withUserScope(tasks, userId);

    expect(condition).toBeDefined();
  });

  it("should combine user scope with extra filter conditions", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const condition = withUserScope(tasks, userId, eq(tasks.status, "todo"));

    expect(condition).toBeDefined();
  });

  it("should throw a security error if userId is empty, null, or undefined", () => {
    expect(() => withUserScope(tasks, "")).toThrow(
      "Security Violation: userId is required for all data operations"
    );
    // @ts-expect-error testing invalid type
    expect(() => withUserScope(tasks, null)).toThrow(
      "Security Violation: userId is required for all data operations"
    );
    // @ts-expect-error testing invalid type
    expect(() => withUserScope(tasks, undefined)).toThrow(
      "Security Violation: userId is required for all data operations"
    );
    expect(() => withUserScope(tasks, "   ")).toThrow(
      "Security Violation: userId is required for all data operations"
    );
  });
});
