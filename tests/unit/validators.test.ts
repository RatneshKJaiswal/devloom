import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  updateTaskSchema,
  createBugSchema,
  updateBugSchema,
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

  it("should coerce empty strings to null for optional task fields", () => {
    const res = updateTaskSchema.safeParse({
      description: "",
      projectId: "",
      startDate: "",
      dueDate: "2026-11-12",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.description).toBeNull();
      expect(res.data.projectId).toBeNull();
      expect(res.data.startDate).toBeNull();
      expect(res.data.dueDate).toBe("2026-11-12");
    }
  });

  it("should validate bug due date update with date-only string and null technical fields", () => {
    const res = updateBugSchema.safeParse({
      dueDate: "2026-11-12",
      stackTrace: null,
      reproSteps: "",
      suspectedCause: null,
      projectId: "",
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.dueDate).toBe("2026-11-12");
      expect(res.data.stackTrace).toBeNull();
      expect(res.data.reproSteps).toBeNull();
      expect(res.data.projectId).toBeNull();
    }
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
