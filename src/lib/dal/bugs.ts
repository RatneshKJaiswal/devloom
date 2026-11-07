import { db } from "@/lib/db";
import { bugs, bugTags, tags, projects, githubLinks, taskBugs, tasks } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface BugFilterOptions {
  status?: "open" | "confirmed" | "fixing" | "resolved" | "closed" | "wont_fix";
  priority?: "low" | "medium" | "high" | "urgent";
  projectId?: string;
  limit?: number;
  offset?: number;
}

export async function listBugs(userId: string, options: BugFilterOptions = {}) {
  const conditions = [];

  if (options.status) {
    conditions.push(eq(bugs.status, options.status));
  }
  if (options.priority) {
    conditions.push(eq(bugs.priority, options.priority));
  }
  if (options.projectId) {
    conditions.push(eq(bugs.projectId, options.projectId));
  }

  const combinedExtra = conditions.length > 0 ? and(...conditions) : undefined;

  const rawBugs = await db
    .select({
      id: bugs.id,
      bugNumber: bugs.bugNumber,
      userId: bugs.userId,
      projectId: bugs.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: bugs.title,
      description: bugs.description,
      stackTrace: bugs.stackTrace,
      reproSteps: bugs.reproSteps,
      suspectedCause: bugs.suspectedCause,
      status: bugs.status,
      priority: bugs.priority,
      dueDate: bugs.dueDate,
      createdAt: bugs.createdAt,
      updatedAt: bugs.updatedAt,
    })
    .from(bugs)
    .leftJoin(projects, eq(bugs.projectId, projects.id))
    .where(withUserScope(bugs, userId, combinedExtra))
    .orderBy(desc(bugs.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  if (rawBugs.length === 0) return [];

  // Fetch tags for these bugs
  const bugIds = rawBugs.map((b) => b.id);
  const tagRows = await db
    .select({
      bugId: bugTags.bugId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(bugTags)
    .innerJoin(tags, eq(bugTags.tagId, tags.id))
    .where(inArray(bugTags.bugId, bugIds));

  const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
  for (const row of tagRows) {
    const list = tagMap.get(row.bugId) || [];
    list.push({ id: row.tagId, name: row.tagName, color: row.tagColor });
    tagMap.set(row.bugId, list);
  }

  // Fetch associated tasks for these bugs
  const taskRows = await db
    .select({
      bugId: taskBugs.bugId,
      id: tasks.id,
      taskNumber: tasks.taskNumber,
      title: tasks.title,
      status: tasks.status,
    })
    .from(taskBugs)
    .innerJoin(tasks, eq(taskBugs.taskId, tasks.id))
    .where(inArray(taskBugs.bugId, bugIds));

  const taskMap = new Map<string, Array<any>>();
  for (const row of taskRows) {
    const list = taskMap.get(row.bugId) || [];
    list.push({
      id: row.id,
      taskNumber: row.taskNumber,
      title: row.title,
      status: row.status,
    });
    taskMap.set(row.bugId, list);
  }

  // Fetch GitHub links for these bugs
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
        eq(githubLinks.entityType, "bug"),
        inArray(githubLinks.entityId, bugIds)
      )
    );

  const linkMap = new Map<string, Array<any>>();
  for (const row of linkRows) {
    const list = linkMap.get(row.entityId) || [];
    list.push(row);
    linkMap.set(row.entityId, list);
  }

  return rawBugs.map((bug) => ({
    ...bug,
    tags: tagMap.get(bug.id) || [],
    githubLinks: linkMap.get(bug.id) || [],
    associatedTasks: taskMap.get(bug.id) || [],
  }));
}

export async function getBugById(userId: string, id: string) {
  const results = await db
    .select({
      id: bugs.id,
      bugNumber: bugs.bugNumber,
      userId: bugs.userId,
      projectId: bugs.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: bugs.title,
      description: bugs.description,
      stackTrace: bugs.stackTrace,
      reproSteps: bugs.reproSteps,
      suspectedCause: bugs.suspectedCause,
      status: bugs.status,
      priority: bugs.priority,
      dueDate: bugs.dueDate,
      createdAt: bugs.createdAt,
      updatedAt: bugs.updatedAt,
    })
    .from(bugs)
    .leftJoin(projects, eq(bugs.projectId, projects.id))
    .where(withUserScope(bugs, userId, eq(bugs.id, id)))
    .limit(1);

  const bug = results[0];
  if (!bug) return null;

  const tagRows = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(bugTags)
    .innerJoin(tags, eq(bugTags.tagId, tags.id))
    .where(eq(bugTags.bugId, bug.id));

  const taskRows = await db
    .select({
      id: tasks.id,
      taskNumber: tasks.taskNumber,
      title: tasks.title,
      status: tasks.status,
    })
    .from(taskBugs)
    .innerJoin(tasks, eq(taskBugs.taskId, tasks.id))
    .where(eq(taskBugs.bugId, bug.id));

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
        eq(githubLinks.entityType, "bug"),
        eq(githubLinks.entityId, bug.id)
      )
    );

  return {
    ...bug,
    tags: tagRows,
    githubLinks: linkRows,
    associatedTasks: taskRows,
  };
}

export async function createBug(
  userId: string,
  data: {
    title: string;
    description?: string | null;
    stackTrace?: string | null;
    reproSteps?: string | null;
    suspectedCause?: string | null;
    status?: "open" | "confirmed" | "fixing" | "resolved" | "closed" | "wont_fix";
    priority?: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
  },
  tagIds?: string[],
  taskId?: string | null
) {
  const [created] = await db
    .insert(bugs)
    .values({
      userId,
      title: data.title,
      description: data.description,
      stackTrace: data.stackTrace,
      reproSteps: data.reproSteps,
      suspectedCause: data.suspectedCause,
      status: data.status || "open",
      priority: data.priority || "medium",
      projectId: data.projectId || null,
      dueDate: data.dueDate && !isNaN(new Date(data.dueDate).getTime()) ? new Date(data.dueDate) : null,
    })
    .returning();

  if (tagIds && tagIds.length > 0) {
    await db.insert(bugTags).values(
      tagIds.map((tagId) => ({
        bugId: created.id,
        tagId,
      }))
    );
  }

  if (taskId) {
    await db.insert(taskBugs).values({
      userId,
      taskId,
      bugId: created.id,
    });
  }

  return getBugById(userId, created.id);
}

export async function updateBug(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description?: string | null;
    stackTrace?: string | null;
    reproSteps?: string | null;
    suspectedCause?: string | null;
    status: "open" | "confirmed" | "fixing" | "resolved" | "closed" | "wont_fix";
    priority: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
  }>,
  tagIds?: string[],
  taskId?: string | null
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.stackTrace !== undefined) updateData.stackTrace = data.stackTrace;
  if (data.reproSteps !== undefined) updateData.reproSteps = data.reproSteps;
  if (data.suspectedCause !== undefined) updateData.suspectedCause = data.suspectedCause;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;
  if (data.dueDate !== undefined) {
    if (!data.dueDate) {
      updateData.dueDate = null;
    } else {
      const parsedDate = new Date(data.dueDate);
      updateData.dueDate = isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
  }

  const [updated] = await db
    .update(bugs)
    .set(updateData)
    .where(withUserScope(bugs, userId, eq(bugs.id, id)))
    .returning();

  if (!updated) return null;

  if (tagIds !== undefined) {
    await db.delete(bugTags).where(eq(bugTags.bugId, id));
    if (tagIds.length > 0) {
      await db.insert(bugTags).values(
        tagIds.map((tagId) => ({
          bugId: id,
          tagId,
        }))
      );
    }
  }

  if (taskId !== undefined) {
    await db.delete(taskBugs).where(and(eq(taskBugs.bugId, id), eq(taskBugs.userId, userId)));
    if (taskId) {
      await db.insert(taskBugs).values({
        userId,
        taskId,
        bugId: id,
      });
    }
  }

  // Check all tasks linked to this bug - completing all bugs results in end of task
  const linkedTaskRows = await db
    .select({ taskId: taskBugs.taskId })
    .from(taskBugs)
    .where(eq(taskBugs.bugId, id));

  for (const { taskId: tId } of linkedTaskRows) {
    const allBugsForTask = await db
      .select({ status: bugs.status })
      .from(taskBugs)
      .innerJoin(bugs, eq(taskBugs.bugId, bugs.id))
      .where(eq(taskBugs.taskId, tId));

    const allResolved =
      allBugsForTask.length > 0 &&
      allBugsForTask.every(
        (b) => b.status === "resolved" || b.status === "closed"
      );

    if (allResolved) {
      await db
        .update(tasks)
        .set({
          status: "done",
          completedAt: new Date(),
          updatedAt: new Date(),
          version: sql`${tasks.version} + 1`,
        })
        .where(and(eq(tasks.id, tId), eq(tasks.userId, userId)));
    }
  }

  return getBugById(userId, id);
}

export async function deleteBug(userId: string, id: string) {
  // Cascading cleanup of polymorphic GitHub links
  await db
    .delete(githubLinks)
    .where(
      and(
        withUserScope(githubLinks, userId),
        eq(githubLinks.entityType, "bug"),
        eq(githubLinks.entityId, id)
      )
    );

  const [deleted] = await db
    .delete(bugs)
    .where(withUserScope(bugs, userId, eq(bugs.id, id)))
    .returning();

  return deleted || null;
}
