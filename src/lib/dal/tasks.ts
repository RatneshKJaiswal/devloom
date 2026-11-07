import { db } from "@/lib/db";
import { tasks, taskTags, tags, projects } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, and, inArray } from "drizzle-orm";

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
      userId: tasks.userId,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
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

  return rawTasks.map((task) => ({
    ...task,
    tags: tagMap.get(task.id) || [],
  }));
}

export async function getTaskById(userId: string, id: string) {
  const results = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      projectId: tasks.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
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

  return {
    ...task,
    tags: tagRows,
  };
}

export async function createTask(
  userId: string,
  data: {
    title: string;
    description?: string;
    status?: "todo" | "in_progress" | "done" | "cancelled";
    priority?: "low" | "medium" | "high" | "urgent";
    projectId?: string | null;
    dueDate?: string | null;
  },
  tagIds?: string[]
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
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
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

  return getTaskById(userId, created.id);
}

export async function updateTask(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    description?: string;
    status: "todo" | "in_progress" | "done" | "cancelled";
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
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
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

export async function deleteTask(userId: string, id: string) {
  const [deleted] = await db
    .delete(tasks)
    .where(withUserScope(tasks, userId, eq(tasks.id, id)))
    .returning();

  return deleted || null;
}
