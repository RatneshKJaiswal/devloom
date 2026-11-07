import { db } from "@/lib/db";
import {
  projects,
  projectPhaseHistory,
  projectMilestones,
  tags,
  tasks,
  bugs,
  learnings,
} from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, sql, and, isNull } from "drizzle-orm";

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

  const taskMap = new Map(taskCounts.map((r) => [r.projectId, Number(r.count) || 0]));
  const bugMap = new Map(bugCounts.map((r) => [r.projectId, Number(r.count) || 0]));
  const learningMap = new Map(learningCounts.map((r) => [r.projectId, Number(r.count) || 0]));

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

  const [projectTasks, projectBugs, projectLearnings, history, milestones] = await Promise.all([
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
    db
      .select()
      .from(projectPhaseHistory)
      .where(withUserScope(projectPhaseHistory, userId, eq(projectPhaseHistory.projectId, id)))
      .orderBy(desc(projectPhaseHistory.startedAt)),
    db
      .select()
      .from(projectMilestones)
      .where(withUserScope(projectMilestones, userId, eq(projectMilestones.projectId, id)))
      .orderBy(projectMilestones.targetDate),
  ]);

  return {
    project,
    tasks: projectTasks,
    bugs: projectBugs,
    learnings: projectLearnings,
    phaseHistory: history,
    milestones,
  };
}

export async function createProject(
  userId: string,
  data: {
    name: string;
    description?: string;
    color?: string;
    startDate?: string | null;
    targetDate?: string | null;
    currentPhase?: any;
  }
) {
  const [created] = await db
    .insert(projects)
    .values({
      userId,
      name: data.name,
      description: data.description,
      color: data.color || "#4285F4",
      currentPhase: data.currentPhase || "planning",
      startDate: data.startDate,
      targetDate: data.targetDate,
    })
    .returning();

  // Create initial phase history record
  if (created) {
    await db.insert(projectPhaseHistory).values({
      userId,
      projectId: created.id,
      phase: created.currentPhase,
      startedAt: new Date(),
    });
  }

  return created;
}

export async function updateProject(
  userId: string,
  id: string,
  data: Partial<{
    name: string;
    description?: string;
    color?: string;
    startDate?: string | null;
    targetDate?: string | null;
  }>
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

export async function transitionProjectPhase(
  userId: string,
  projectId: string,
  newPhase: any,
  notes?: string
) {
  // 1. Close current open phase record
  await db
    .update(projectPhaseHistory)
    .set({ completedAt: new Date() })
    .where(
      withUserScope(
        projectPhaseHistory,
        userId,
        and(
          eq(projectPhaseHistory.projectId, projectId),
          isNull(projectPhaseHistory.completedAt)
        )
      )
    );

  // 2. Insert new phase history record
  const [newHistory] = await db
    .insert(projectPhaseHistory)
    .values({
      userId,
      projectId,
      phase: newPhase,
      startedAt: new Date(),
      notes,
    })
    .returning();

  // 3. Update currentPhase on projects
  const [updatedProject] = await db
    .update(projects)
    .set({
      currentPhase: newPhase,
      updatedAt: new Date(),
    })
    .where(withUserScope(projects, userId, eq(projects.id, projectId)))
    .returning();

  return {
    project: updatedProject,
    phaseHistory: newHistory,
  };
}

// ---------------- Milestones ----------------

export async function listProjectMilestones(userId: string, projectId: string) {
  return db
    .select()
    .from(projectMilestones)
    .where(withUserScope(projectMilestones, userId, eq(projectMilestones.projectId, projectId)))
    .orderBy(projectMilestones.targetDate);
}

export async function createProjectMilestone(
  userId: string,
  data: {
    projectId: string;
    title: string;
    description?: string;
    targetDate: string;
  }
) {
  const [created] = await db
    .insert(projectMilestones)
    .values({
      userId,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      targetDate: data.targetDate,
    })
    .returning();

  return created;
}

export async function updateProjectMilestone(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description?: string;
    targetDate: string;
    isCompleted: boolean;
  }>
) {
  const [updated] = await db
    .update(projectMilestones)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(withUserScope(projectMilestones, userId, eq(projectMilestones.id, id)))
    .returning();

  return updated || null;
}

export async function deleteProjectMilestone(userId: string, id: string) {
  const [deleted] = await db
    .delete(projectMilestones)
    .where(withUserScope(projectMilestones, userId, eq(projectMilestones.id, id)))
    .returning();

  return deleted || null;
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
