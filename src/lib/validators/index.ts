import { z } from "zod";

export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const taskStatusEnum = z.enum(["todo", "in_progress", "done", "cancelled"]);
export const bugStatusEnum = z.enum(["open", "confirmed", "fixing", "resolved", "closed", "wont_fix"]);
export const reviewStatusEnum = z.enum(["new", "learning", "learned", "mastered"]);
export const sdlcPhaseEnum = z.enum([
  "planning",
  "design",
  "development",
  "testing",
  "release",
  "maintenance",
]);

export const dateOnlyString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format");

// Coerces empty string "" to null for optional foreign keys and dates
const emptyStringToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === "" ? null : val), schema);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: emptyStringToNull(z.string().nullable().optional()),
  status: taskStatusEnum.default("todo"),
  priority: priorityEnum.default("medium"),
  phase: sdlcPhaseEnum.optional().nullable(),
  projectId: emptyStringToNull(z.string().uuid().nullable().optional()),
  startDate: emptyStringToNull(z.string().nullable().optional()),
  dueDate: emptyStringToNull(z.string().nullable().optional()),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const rescheduleTaskSchema = z.object({
  startDate: emptyStringToNull(z.string().nullable().optional()),
  dueDate: emptyStringToNull(z.string().nullable().optional()),
  expectedVersion: z.number().int().min(1, "expectedVersion must be a positive integer"),
});

export const createBugSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: emptyStringToNull(z.string().nullable().optional()),
  stackTrace: emptyStringToNull(z.string().nullable().optional()),
  reproSteps: emptyStringToNull(z.string().nullable().optional()),
  suspectedCause: emptyStringToNull(z.string().nullable().optional()),
  status: bugStatusEnum.default("open"),
  priority: priorityEnum.default("medium"),
  phase: sdlcPhaseEnum.optional().nullable(),
  projectId: emptyStringToNull(z.string().uuid().nullable().optional()),
  startDate: emptyStringToNull(z.string().nullable().optional()),
  dueDate: emptyStringToNull(z.string().nullable().optional()),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateBugSchema = createBugSchema.partial();

export const createLearningSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  projectId: emptyStringToNull(z.string().uuid().nullable().optional()),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateLearningSchema = createLearningSchema.partial();

export const reviewLearningSchema = z.object({
  passed: z.boolean(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").default("#4285F4"),
  currentPhase: sdlcPhaseEnum.optional(),
  startDate: dateOnlyString.optional().nullable(),
  targetDate: dateOnlyString.optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const transitionProjectPhaseSchema = z.object({
  phase: sdlcPhaseEnum,
  notes: z.string().optional(),
});

export const createProjectMilestoneSchema = z.object({
  title: z.string().min(1, "Milestone title is required").max(255),
  description: z.string().optional(),
  targetDate: dateOnlyString,
});

export const updateProjectMilestoneSchema = createProjectMilestoneSchema
  .partial()
  .extend({
    isCompleted: z.boolean().optional(),
  });

export const createTaskDependencySchema = z.object({
  predecessorId: z.string().uuid("Predecessor task ID must be a valid UUID"),
  successorId: z.string().uuid("Successor task ID must be a valid UUID"),
});

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").default("#64748B"),
});
