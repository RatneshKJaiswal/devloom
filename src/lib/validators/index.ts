import { z } from "zod";

export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusEnum = z.enum(["todo", "in_progress", "done", "cancelled"]);
export const bugStatusEnum = z.enum(["open", "confirmed", "fixing", "resolved", "closed", "wont_fix"]);
export const reviewStatusEnum = z.enum(["new", "learning", "learned", "mastered"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  status: taskStatusEnum.default("todo"),
  priority: priorityEnum.default("medium"),
  projectId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createBugSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  stackTrace: z.string().optional(),
  reproSteps: z.string().optional(),
  suspectedCause: z.string().optional(),
  status: bugStatusEnum.default("open"),
  priority: priorityEnum.default("medium"),
  projectId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateBugSchema = createBugSchema.partial();

export const createLearningSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  projectId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateLearningSchema = createLearningSchema.partial();

export const reviewLearningSchema = z.object({
  passed: z.boolean(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").default("#6366F1"),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").default("#64748B"),
});
