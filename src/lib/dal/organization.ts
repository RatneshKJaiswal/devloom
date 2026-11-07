import { db } from "@/lib/db";
import { projects, tags, tasks, bugs, learnings } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, sql } from "drizzle-orm";

export async function listProjects(userId: string) {
  const allProjects = await db
    .select()
    .from(projects)
    .where(withUserScope(projects, userId))
    .orderBy(desc(projects.createdAt));

  if (allProjects.length === 0) return [];

  // Fetch counts of associated tasks, bugs, and learnings
  const [taskCounts, bugCounts, learningCounts] = await Promise.all([
    db
      .select({
        projectId: tasks.projectId,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(withUserScope(tasks, userId))
      .groupBy(tasks.projectId),
    db
      .select({
        projectId: bugs.projectId,
        count: sql<number>`count(*)::int`,
      })
      .from(bugs)
      .where(withUserScope(bugs, userId))
      .groupBy(bugs.projectId),
    db
      .select({
        projectId: learnings.projectId,
        count: sql<number>`count(*)::int`,
      })
      .from(learnings)
      .where(withUserScope(learnings, userId))
      .groupBy(learnings.projectId),
  ]);

  const taskMap = new Map(taskCounts.map((r) => [r.projectId, r.count]));
  const bugMap = new Map(bugCounts.map((r) => [r.projectId, r.count]));
  const learningMap = new Map(learningCounts.map((r) => [r.projectId, r.count]));

  return allProjects.map((p) => {
    const tCount = taskMap.get(p.id) || 0;
    const bCount = bugMap.get(p.id) || 0;
    const lCount = learningMap.get(p.id) || 0;

    return {
      ...p,
      counts: {
        tasks: tCount,
        bugs: bCount,
        learnings: lCount,
        total: tCount + bCount + lCount,
      },
    };
  });
}

export async function getProjectById(userId: string, id: string) {
  const results = await db
    .select()
    .from(projects)
    .where(withUserScope(projects, userId, eq(projects.id, id)))
    .limit(1);

  return results[0] || null;
}

export async function getProjectDetails(userId: string, id: string) {
  const project = await getProjectById(userId, id);
  if (!project) return null;

  const [projectTasks, projectBugs, projectLearnings] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(withUserScope(tasks, userId, eq(tasks.projectId, id)))
      .orderBy(desc(tasks.createdAt)),
    db
      .select()
      .from(bugs)
      .where(withUserScope(bugs, userId, eq(bugs.projectId, id)))
      .orderBy(desc(bugs.createdAt)),
    db
      .select()
      .from(learnings)
      .where(withUserScope(learnings, userId, eq(learnings.projectId, id)))
      .orderBy(desc(learnings.createdAt)),
  ]);

  return {
    project,
    tasks: projectTasks,
    bugs: projectBugs,
    learnings: projectLearnings,
  };
}

export async function createProject(
  userId: string,
  data: { name: string; description?: string; color?: string }
) {
  const [created] = await db
    .insert(projects)
    .values({
      userId,
      name: data.name,
      description: data.description,
      color: data.color || "#6366F1",
    })
    .returning();

  return created;
}

export async function updateProject(
  userId: string,
  id: string,
  data: Partial<{ name: string; description?: string; color?: string }>
) {
  const [updated] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(withUserScope(projects, userId, eq(projects.id, id)))
    .returning();

  return updated || null;
}

export async function deleteProject(userId: string, id: string) {
  const [deleted] = await db
    .delete(projects)
    .where(withUserScope(projects, userId, eq(projects.id, id)))
    .returning();

  return deleted || null;
}

// ---------------- Tags ----------------

export async function listTags(userId: string) {
  return db
    .select()
    .from(tags)
    .where(withUserScope(tags, userId))
    .orderBy(desc(tags.createdAt));
}

export async function createTag(
  userId: string,
  data: { name: string; color?: string }
) {
  const [created] = await db
    .insert(tags)
    .values({
      userId,
      name: data.name,
      color: data.color || "#64748B",
    })
    .returning();

  return created;
}

export async function deleteTag(userId: string, id: string) {
  const [deleted] = await db
    .delete(tags)
    .where(withUserScope(tags, userId, eq(tags.id, id)))
    .returning();

  return deleted || null;
}
