import { db } from "@/lib/db";
import { tasks, taskTags, tags, projects, taskDependencies, githubLinks, bugs, taskBugs } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface TaskFilterOptions {
  status?: "todo" | "in_progress" | "done" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  projectId?: string;
  limit?: number;
  offset?: number;
}

export async function listTasks(userId: string, options: TaskFilterOptions = {}) {
  const conditions = [];

  if (options.status) {
    conditions.push(eq(tasks.status, options.status));
  }
  if (options.priority) {
    conditions.push(eq(tasks.priority, options.priority));
  }
  if (options.projectId) {
    conditions.push(eq(tasks.projectId, options.projectId));
  }

  const combinedExtra = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: tasks.id,
      taskNumber: tasks.taskNumber,
      userId: tasks.userId,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      version: tasks.version,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(withUserScope(tasks, userId, combinedExtra))
    .orderBy(desc(tasks.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  const rawTasks = await query;
  if (rawTasks.length === 0) return [];

  // Fetch tags for these tasks
  const taskIds = rawTasks.map((t) => t.id);
  const tagRows = await db
    .select({
      taskId: taskTags.taskId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(taskTags)
    .innerJoin(tags, eq(taskTags.tagId, tags.id))
    .where(inArray(taskTags.taskId, taskIds));

  const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
  for (const row of tagRows) {
    const list = tagMap.get(row.taskId) || [];
    list.push({ id: row.tagId, name: row.tagName, color: row.tagColor });
    tagMap.set(row.taskId, list);
  }

  // Fetch associated bugs for these tasks
  const bugRows = await db
    .select({
      taskId: taskBugs.taskId,
      id: bugs.id,
      bugNumber: bugs.bugNumber,
      title: bugs.title,
      status: bugs.status,
      priority: bugs.priority,
    })
    .from(taskBugs)
    .innerJoin(bugs, eq(taskBugs.bugId, bugs.id))
    .where(inArray(taskBugs.taskId, taskIds));

  const bugMap = new Map<string, Array<any>>();
  for (const row of bugRows) {
    const list = bugMap.get(row.taskId) || [];
    list.push({
      id: row.id,
      bugNumber: row.bugNumber,
      title: row.title,
      status: row.status,
      priority: row.priority,
    });
    bugMap.set(row.taskId, list);
  }

  // Fetch GitHub links for these tasks
  const linkRows = await db
    .select({
      id: githubLinks.id,
      entityId: githubLinks.entityId,
      url: githubLinks.url,
      linkType: githubLinks.linkType,
      repoOwner: githubLinks.repoOwner,
      repoName: githubLinks.repoName,
      issueOrPrNumber: githubLinks.issueOrPrNumber,
      filePath: githubLinks.filePath,
      cachedTitle: githubLinks.cachedTitle,
      cachedState: githubLinks.cachedState,
    })
    .from(githubLinks)
    .where(
      and(
        eq(githubLinks.entityType, "task"),
        inArray(githubLinks.entityId, taskIds)
      )
    );

  const linkMap = new Map<string, Array<any>>();
  for (const row of linkRows) {
    const list = linkMap.get(row.entityId) || [];
    list.push(row);
    linkMap.set(row.entityId, list);
  }

  return rawTasks.map((task) => ({
    ...task,
    tags: tagMap.get(task.id) || [],
    githubLinks: linkMap.get(task.id) || [],
    associatedBugs: bugMap.get(task.id) || [],
  }));
}

export async function getTaskById(userId: string, id: string) {
  const results = await db
    .select({
      id: tasks.id,
      taskNumber: tasks.taskNumber,
      userId: tasks.userId,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      completedAt: tasks.completedAt,
      version: tasks.version,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(withUserScope(tasks, userId, eq(tasks.id, id)))
    .limit(1);

  const task = results[0];
  if (!task) return null;

  const tagRows = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(taskTags)
    .innerJoin(tags, eq(taskTags.tagId, tags.id))
    .where(eq(taskTags.taskId, task.id));

  const bugRows = await db
    .select({
      id: bugs.id,
      bugNumber: bugs.bugNumber,
      title: bugs.title,
      status: bugs.status,
      priority: bugs.priority,
    })
    .from(taskBugs)
    .innerJoin(bugs, eq(taskBugs.bugId, bugs.id))
    .where(eq(taskBugs.taskId, task.id));

  const linkRows = await db
    .select({
      id: githubLinks.id,
      entityId: githubLinks.entityId,
      url: githubLinks.url,
      linkType: githubLinks.linkType,
      repoOwner: githubLinks.repoOwner,
      repoName: githubLinks.repoName,
      issueOrPrNumber: githubLinks.issueOrPrNumber,
      filePath: githubLinks.filePath,
      cachedTitle: githubLinks.cachedTitle,
      cachedState: githubLinks.cachedState,
    })
    .from(githubLinks)
    .where(
      and(
        eq(githubLinks.entityType, "task"),
        eq(githubLinks.entityId, task.id)
      )
    );

  return {
    ...task,
    tags: tagRows,
    githubLinks: linkRows,
    associatedBugs: bugRows,
  };
}

export async function createTask(
  userId: string,
  data: {
    title: string;
    description?: string | null;
    status?: "todo" | "in_progress" | "done" | "cancelled";
    priority?: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
  },
  tagIds?: string[],
  bugIds?: string[]
) {
  const [created] = await db
    .insert(tasks)
    .values({
      userId,
      title: data.title,
      description: data.description,
      status: data.status || "todo",
      priority: data.priority || "medium",
      projectId: data.projectId || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      completedAt: data.status === "done" ? new Date() : null,
    })
    .returning();

  if (tagIds && tagIds.length > 0) {
    await db.insert(taskTags).values(
      tagIds.map((tagId) => ({
        taskId: created.id,
        tagId,
      }))
    );
  }

  if (bugIds && bugIds.length > 0) {
    await db.insert(taskBugs).values(
      bugIds.map((bugId) => ({
        userId,
        taskId: created.id,
        bugId,
      }))
    );
  }

  return getTaskById(userId, created.id);
}

export async function updateTask(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description?: string | null;
    status: "todo" | "in_progress" | "done" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
  }>,
  tagIds?: string[],
  bugIds?: string[]
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    version: sql`${tasks.version} + 1`,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === "done") {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }
  }
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;
  if (data.startDate !== undefined) {
    updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  if (bugIds !== undefined) {
    await db.delete(taskBugs).where(and(eq(taskBugs.taskId, id), eq(taskBugs.userId, userId)));
    if (bugIds.length > 0) {
      await db.insert(taskBugs).values(
        bugIds.map((bugId) => ({
          userId,
          taskId: id,
          bugId,
        }))
      );

      // Check if all newly associated bugs are resolved/closed
      const linkedBugs = await db
        .select({ status: bugs.status })
        .from(bugs)
        .where(inArray(bugs.id, bugIds));

      if (
        linkedBugs.length > 0 &&
        linkedBugs.every((b) => b.status === "resolved" || b.status === "closed")
      ) {
        updateData.status = "done";
        updateData.completedAt = new Date();
      }
    }
  }

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(withUserScope(tasks, userId, eq(tasks.id, id)))
    .returning();

  if (!updated) return null;

  if (tagIds !== undefined) {
    await db.delete(taskTags).where(eq(taskTags.taskId, id));
    if (tagIds.length > 0) {
      await db.insert(taskTags).values(
        tagIds.map((tagId) => ({
          taskId: id,
          tagId,
        }))
      );
    }
  }

  return getTaskById(userId, id);
}

export type RescheduleResult =
  | { success: true; task: NonNullable<Awaited<ReturnType<typeof getTaskById>>> }
  | { error: "not_found" }
  | { error: "version_conflict"; currentVersion: number; task: Awaited<ReturnType<typeof getTaskById>> }
  | { error: "invalid_dates"; message: string }
  | { error: "predecessor_conflict"; message: string };

export async function rescheduleTask(
  userId: string,
  taskId: string,
  params: {
    startDate?: string | null;
    dueDate?: string | null;
    expectedVersion: number;
  }
): Promise<RescheduleResult> {
  const task = await getTaskById(userId, taskId);
  if (!task) return { error: "not_found" };

  if (task.version !== params.expectedVersion) {
    return {
      error: "version_conflict",
      currentVersion: task.version,
      task,
    };
  }

  const parsedStart = params.startDate ? new Date(params.startDate) : null;
  const parsedDue = params.dueDate ? new Date(params.dueDate) : null;

  if (parsedStart && isNaN(parsedStart.getTime())) {
    return { error: "invalid_dates", message: "Invalid start date format" };
  }
  if (parsedDue && isNaN(parsedDue.getTime())) {
    return { error: "invalid_dates", message: "Invalid due date format" };
  }
  if (parsedStart && parsedDue && parsedStart.getTime() > parsedDue.getTime()) {
    return { error: "invalid_dates", message: "Start date cannot be after due date" };
  }

  // Dependency constraint validation: check predecessor completion dates
  if (parsedStart) {
    const deps = await db
      .select({
        predId: taskDependencies.predecessorId,
        predTitle: tasks.title,
        predDueDate: tasks.dueDate,
        predStatus: tasks.status,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(taskDependencies.predecessorId, tasks.id))
      .where(
        and(
          eq(taskDependencies.userId, userId),
          eq(taskDependencies.successorId, taskId)
        )
      );

    for (const dep of deps) {
      if (dep.predDueDate) {
        const predDate = new Date(dep.predDueDate);
        if (parsedStart.getTime() < predDate.getTime()) {
          const dateStr = predDate.toISOString().slice(0, 10);
          return {
            error: "predecessor_conflict",
            message: `Cannot start before predecessor "${dep.predTitle}" finishes on ${dateStr}`,
          };
        }
      }
    }
  }

  const [updated] = await db
    .update(tasks)
    .set({
      startDate: parsedStart,
      dueDate: parsedDue,
      version: task.version + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        withUserScope(tasks, userId, eq(tasks.id, taskId)),
        eq(tasks.version, params.expectedVersion)
      )
    )
    .returning();

  if (!updated) {
    const fresh = await getTaskById(userId, taskId);
    return {
      error: "version_conflict",
      currentVersion: fresh?.version ?? 0,
      task: fresh,
    };
  }

  const refreshed = await getTaskById(userId, taskId);
  return { success: true, task: refreshed! };
}

export async function deleteTask(userId: string, id: string) {
  // Cascading cleanup of polymorphic GitHub links
  await db
    .delete(githubLinks)
    .where(
      and(
        withUserScope(githubLinks, userId),
        eq(githubLinks.entityType, "task"),
        eq(githubLinks.entityId, id)
      )
    );

  const [deleted] = await db
    .delete(tasks)
    .where(withUserScope(tasks, userId, eq(tasks.id, id)))
    .returning();

  return deleted || null;
}
