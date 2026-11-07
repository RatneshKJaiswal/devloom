import { db } from "@/lib/db";
import { bugs, bugTags, tags, projects } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, and, inArray } from "drizzle-orm";

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

  return rawBugs.map((bug) => ({
    ...bug,
    tags: tagMap.get(bug.id) || [],
  }));
}

export async function getBugById(userId: string, id: string) {
  const results = await db
    .select({
      id: bugs.id,
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

  return {
    ...bug,
    tags: tagRows,
  };
}

export async function createBug(
  userId: string,
  data: {
    title: string;
    description?: string;
    stackTrace?: string;
    reproSteps?: string;
    suspectedCause?: string;
    status?: "open" | "confirmed" | "fixing" | "resolved" | "closed" | "wont_fix";
    priority?: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    dueDate?: string | null;
  },
  tagIds?: string[]
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
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
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

  return getBugById(userId, created.id);
}

export async function updateBug(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description?: string;
    stackTrace?: string;
    reproSteps?: string;
    suspectedCause?: string;
    status: "open" | "confirmed" | "fixing" | "resolved" | "closed" | "wont_fix";
    priority: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    dueDate?: string | null;
  }>,
  tagIds?: string[]
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
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
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

  return getBugById(userId, id);
}

export async function deleteBug(userId: string, id: string) {
  const [deleted] = await db
    .delete(bugs)
    .where(withUserScope(bugs, userId, eq(bugs.id, id)))
    .returning();

  return deleted || null;
}
