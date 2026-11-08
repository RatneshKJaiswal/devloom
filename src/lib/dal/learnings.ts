import { db } from "@/lib/db";
import { learnings, learningTags, tags, projects, githubLinks } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, and, inArray } from "drizzle-orm";

export interface LearningFilterOptions {
  projectId?: string;
  limit?: number;
  offset?: number;
}

export async function listLearnings(userId: string, options: LearningFilterOptions = {}) {
  const conditions = [];

  if (options.projectId) {
    conditions.push(eq(learnings.projectId, options.projectId));
  }

  const combinedExtra = conditions.length > 0 ? and(...conditions) : undefined;

  const rawLearnings = await db
    .select({
      id: learnings.id,
      userId: learnings.userId,
      projectId: learnings.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: learnings.title,
      content: learnings.content,
      createdAt: learnings.createdAt,
      updatedAt: learnings.updatedAt,
    })
    .from(learnings)
    .leftJoin(projects, eq(learnings.projectId, projects.id))
    .where(withUserScope(learnings, userId, combinedExtra))
    .orderBy(desc(learnings.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  if (rawLearnings.length === 0) return [];

  const learningIds = rawLearnings.map((l) => l.id);
  const tagRows = await db
    .select({
      learningId: learningTags.learningId,
      tagId: tags.id,
      tagName: tags.name,
      tagColor: tags.color,
    })
    .from(learningTags)
    .innerJoin(tags, eq(learningTags.tagId, tags.id))
    .where(inArray(learningTags.learningId, learningIds));

  const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
  for (const row of tagRows) {
    const list = tagMap.get(row.learningId) || [];
    list.push({ id: row.tagId, name: row.tagName, color: row.tagColor });
    tagMap.set(row.learningId, list);
  }

  return rawLearnings.map((item) => ({
    ...item,
    tags: tagMap.get(item.id) || [],
  }));
}

export async function getLearningById(userId: string, id: string) {
  const results = await db
    .select({
      id: learnings.id,
      userId: learnings.userId,
      projectId: learnings.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      title: learnings.title,
      content: learnings.content,
      createdAt: learnings.createdAt,
      updatedAt: learnings.updatedAt,
    })
    .from(learnings)
    .leftJoin(projects, eq(learnings.projectId, projects.id))
    .where(withUserScope(learnings, userId, eq(learnings.id, id)))
    .limit(1);

  const learning = results[0];
  if (!learning) return null;

  const tagRows = await db
    .select({
      id: tags.id,
      name: tags.name,
      color: tags.color,
    })
    .from(learningTags)
    .innerJoin(tags, eq(learningTags.tagId, tags.id))
    .where(eq(learningTags.learningId, learning.id));

  return {
    ...learning,
    tags: tagRows,
  };
}

export async function createLearning(
  userId: string,
  data: {
    title: string;
    content: string;
    projectId?: string | null;
  },
  tagIds?: string[]
) {
  const [created] = await db
    .insert(learnings)
    .values({
      userId,
      title: data.title,
      content: data.content,
      projectId: data.projectId || null,
    })
    .returning();

  if (tagIds && tagIds.length > 0) {
    await db.insert(learningTags).values(
      tagIds.map((tagId) => ({
        learningId: created.id,
        tagId,
      }))
    );
  }

  return getLearningById(userId, created.id);
}

export async function updateLearning(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    content: string;
    projectId?: string | null;
  }>,
  tagIds?: string[]
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;

  const [updated] = await db
    .update(learnings)
    .set(updateData)
    .where(withUserScope(learnings, userId, eq(learnings.id, id)))
    .returning();

  if (!updated) return null;

  if (tagIds !== undefined) {
    await db.delete(learningTags).where(eq(learningTags.learningId, id));
    if (tagIds.length > 0) {
      await db.insert(learningTags).values(
        tagIds.map((tagId) => ({
          learningId: id,
          tagId,
        }))
      );
    }
  }

  return getLearningById(userId, id);
}

export async function deleteLearning(userId: string, id: string) {
  // Cascading cleanup of polymorphic GitHub links
  await db
    .delete(githubLinks)
    .where(
      and(
        withUserScope(githubLinks, userId),
        eq(githubLinks.entityType, "learning"),
        eq(githubLinks.entityId, id)
      )
    );

  const [deleted] = await db
    .delete(learnings)
    .where(withUserScope(learnings, userId, eq(learnings.id, id)))
    .returning();

  return deleted || null;
}
