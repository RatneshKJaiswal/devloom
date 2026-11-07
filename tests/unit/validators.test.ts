import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  createBugSchema,
  createLearningSchema,
  createProjectSchema,
} from "@/lib/validators";

describe("Input Validation Schemas", () => {
  it("should validate a valid task", () => {
    const valid = createTaskSchema.safeParse({
      title: "Write documentation",
      priority: "high",
      status: "todo",
    });
    expect(valid.success).toBe(true);
  });

  it("should reject task with empty title", () => {
    const invalid = createTaskSchema.safeParse({
      title: "",
      priority: "medium",
    });
    expect(invalid.success).toBe(false);
  });

  it("should reject invalid priority", () => {
    const invalid = createTaskSchema.safeParse({
      title: "Test",
      priority: "super-critical",
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate a valid bug with stack trace and repro steps", () => {
    const valid = createBugSchema.safeParse({
      title: "Connection pool exhaustion",
      stackTrace: "Error: connect ETIMEDOUT at ...",
      reproSteps: "1. Run 100 concurrent requests",
      priority: "urgent",
      status: "open",
    });
    expect(valid.success).toBe(true);
  });

  it("should require content for learnings", () => {
    const invalid = createLearningSchema.safeParse({
      title: "React Server Components Gotcha",
    });
    expect(invalid.success).toBe(false);

    const valid = createLearningSchema.safeParse({
      title: "React Server Components Gotcha",
      content: "Cannot import client event handlers directly in server components.",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate hex colors for projects", () => {
    const valid = createProjectSchema.safeParse({
      name: "API Gateway",
      color: "#6366F1",
    });
    expect(valid.success).toBe(true);

    const invalid = createProjectSchema.safeParse({
      name: "API Gateway",
      color: "blue",
    });
    expect(invalid.success).toBe(false);
  });
});
