import { db } from "@/lib/db";
import { learnings, learningTags, tags, projects } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, desc, and, inArray, lte } from "drizzle-orm";

export interface LearningFilterOptions {
  status?: "new" | "learning" | "learned" | "mastered";
  projectId?: string;
  limit?: number;
  offset?: number;
}

// Leitner box intervals in milliseconds
const LEITNER_INTERVALS_MS: Record<number, number> = {
  1: 1 * 24 * 60 * 60 * 1000,  // 1 day
  2: 3 * 24 * 60 * 60 * 1000,  // 3 days
  3: 7 * 24 * 60 * 60 * 1000,  // 7 days
  4: 14 * 24 * 60 * 60 * 1000, // 14 days
  5: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export async function listLearnings(userId: string, options: LearningFilterOptions = {}) {
  const conditions = [];

  if (options.status) {
    conditions.push(eq(learnings.reviewStatus, options.status));
  }
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
      reviewBox: learnings.reviewBox,
      reviewStatus: learnings.reviewStatus,
      nextReviewAt: learnings.nextReviewAt,
      lastReviewedAt: learnings.lastReviewedAt,
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
      reviewBox: learnings.reviewBox,
      reviewStatus: learnings.reviewStatus,
      nextReviewAt: learnings.nextReviewAt,
      lastReviewedAt: learnings.lastReviewedAt,
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
  // New learnings start in Box 1 and are due in 1 day
  const nextReviewAt = new Date(Date.now() + LEITNER_INTERVALS_MS[1]);

  const [created] = await db
    .insert(learnings)
    .values({
      userId,
      title: data.title,
      content: data.content,
      projectId: data.projectId || null,
      reviewBox: 1,
      reviewStatus: "new",
      nextReviewAt,
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
  const [deleted] = await db
    .delete(learnings)
    .where(withUserScope(learnings, userId, eq(learnings.id, id)))
    .returning();

  return deleted || null;
}

/**
 * Retrieves learnings that are currently due for spaced review (nextReviewAt <= NOW()).
 */
export async function getDueLearnings(userId: string, limit = 20) {
  const now = new Date();

  return db
    .select({
      id: learnings.id,
      title: learnings.title,
      content: learnings.content,
      reviewBox: learnings.reviewBox,
      reviewStatus: learnings.reviewStatus,
      nextReviewAt: learnings.nextReviewAt,
      lastReviewedAt: learnings.lastReviewedAt,
      projectName: projects.name,
      projectColor: projects.color,
    })
    .from(learnings)
    .leftJoin(projects, eq(learnings.projectId, projects.id))
    .where(withUserScope(learnings, userId, lte(learnings.nextReviewAt, now)))
    .orderBy(learnings.nextReviewAt)
    .limit(limit);
}

/**
 * Evaluates a learning review response using the Leitner 5-box algorithm.
 */
export async function recordLearningReview(
  userId: string,
  id: string,
  passed: boolean
) {
  const current = await getLearningById(userId, id);
  if (!current) return null;

  const now = new Date();
  let nextBox: number;
  let nextStatus: "learning" | "learned" | "mastered";

  if (passed) {
    nextBox = Math.min(current.reviewBox + 1, 5);
    if (nextBox >= 5) {
      nextStatus = "mastered";
    } else if (nextBox >= 4) {
      nextStatus = "learned";
    } else {
      nextStatus = "learning";
    }
  } else {
    // Reset to Box 1 on recall failure
    nextBox = 1;
    nextStatus = "learning";
  }

  const intervalMs = LEITNER_INTERVALS_MS[nextBox] || LEITNER_INTERVALS_MS[1];
  const nextReviewAt = new Date(now.getTime() + intervalMs);

  const [updated] = await db
    .update(learnings)
    .set({
      reviewBox: nextBox,
      reviewStatus: nextStatus,
      nextReviewAt,
      lastReviewedAt: now,
      updatedAt: now,
    })
    .where(withUserScope(learnings, userId, eq(learnings.id, id)))
    .returning();

  return updated || null;
}
