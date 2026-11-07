import { db } from "@/lib/db";
import { tasks, bugs, learnings, projects } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { ilike, or, desc, eq } from "drizzle-orm";

export interface UnifiedSearchResult {
  id: string;
  type: "task" | "bug" | "learning";
  title: string;
  preview: string;
  status?: string;
  priority?: string;
  projectName?: string;
  projectColor?: string;
  createdAt: Date;
}

export async function searchAcrossEntities(
  userId: string,
  query: string,
  limit = 20
): Promise<UnifiedSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = `%${trimmed}%`;

  // Execute searches in parallel
  const [matchedTasks, matchedBugs, matchedLearnings] = await Promise.all([
    // Search tasks
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectName: projects.name,
        projectColor: projects.color,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        withUserScope(
          tasks,
          userId,
          or(ilike(tasks.title, pattern), ilike(tasks.description, pattern))
        )
      )
      .orderBy(desc(tasks.createdAt))
      .limit(limit),

    // Search bugs
    db
      .select({
        id: bugs.id,
        title: bugs.title,
        description: bugs.description,
        stackTrace: bugs.stackTrace,
        suspectedCause: bugs.suspectedCause,
        status: bugs.status,
        priority: bugs.priority,
        projectName: projects.name,
        projectColor: projects.color,
        createdAt: bugs.createdAt,
      })
      .from(bugs)
      .leftJoin(projects, eq(bugs.projectId, projects.id))
      .where(
        withUserScope(
          bugs,
          userId,
          or(
            ilike(bugs.title, pattern),
            ilike(bugs.description, pattern),
            ilike(bugs.stackTrace, pattern),
            ilike(bugs.suspectedCause, pattern)
          )
        )
      )
      .orderBy(desc(bugs.createdAt))
      .limit(limit),

    // Search learnings
    db
      .select({
        id: learnings.id,
        title: learnings.title,
        content: learnings.content,
        reviewStatus: learnings.reviewStatus,
        projectName: projects.name,
        projectColor: projects.color,
        createdAt: learnings.createdAt,
      })
      .from(learnings)
      .leftJoin(projects, eq(learnings.projectId, projects.id))
      .where(
        withUserScope(
          learnings,
          userId,
          or(ilike(learnings.title, pattern), ilike(learnings.content, pattern))
        )
      )
      .orderBy(desc(learnings.createdAt))
      .limit(limit),
  ]);

  const results: UnifiedSearchResult[] = [
    ...matchedTasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      preview: t.description || "No description",
      status: t.status,
      priority: t.priority,
      projectName: t.projectName || undefined,
      projectColor: t.projectColor || undefined,
      createdAt: t.createdAt,
    })),
    ...matchedBugs.map((b) => ({
      id: b.id,
      type: "bug" as const,
      title: b.title,
      preview: b.description || b.suspectedCause || b.stackTrace || "No details",
      status: b.status,
      priority: b.priority,
      projectName: b.projectName || undefined,
      projectColor: b.projectColor || undefined,
      createdAt: b.createdAt,
    })),
    ...matchedLearnings.map((l) => ({
      id: l.id,
      type: "learning" as const,
      title: l.title,
      preview: l.content,
      status: l.reviewStatus,
      projectName: l.projectName || undefined,
      projectColor: l.projectColor || undefined,
      createdAt: l.createdAt,
    })),
  ];

  // Sort by created date descending
  return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
