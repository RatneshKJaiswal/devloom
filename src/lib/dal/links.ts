import { db } from "@/lib/db";
import { githubLinks } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { and, desc, eq } from "drizzle-orm";
import { parseGitHubUrl } from "@/lib/github/parser";
import { fetchGitHubMetadata } from "@/lib/github/client";
import { getUserGitHubToken } from "@/lib/security/tokens";

export async function linkItemToGitHub(
  userId: string,
  params: {
    entityType: "task" | "bug" | "learning";
    entityId: string;
    url: string;
  }
) {
  const parsed = parseGitHubUrl(params.url);
  if (!parsed) {
    throw new Error("Invalid GitHub URL. Must be a valid issue, pull request, or file link.");
  }

  // Get user's decrypted GitHub token
  const token = await getUserGitHubToken(userId);

  // Fetch real-time metadata (title & state)
  const metadata = await fetchGitHubMetadata(parsed, token);

  const [created] = await db
    .insert(githubLinks)
    .values({
      userId,
      entityType: params.entityType,
      entityId: params.entityId,
      url: parsed.url,
      linkType: parsed.linkType,
      repoOwner: parsed.repoOwner,
      repoName: parsed.repoName,
      issueOrPrNumber: parsed.issueOrPrNumber || null,
      filePath: parsed.filePath || null,
      cachedTitle: metadata?.title || `${parsed.repoOwner}/${parsed.repoName}`,
      cachedState: metadata?.state || "open",
      syncedAt: new Date(),
    })
    .returning();

  return created;
}

export async function listGitHubLinks(
  userId: string,
  entityType?: "task" | "bug" | "learning",
  entityId?: string
) {
  const conditions = [];
  if (entityType) conditions.push(eq(githubLinks.entityType, entityType));
  if (entityId) conditions.push(eq(githubLinks.entityId, entityId));

  const extra = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(githubLinks)
    .where(withUserScope(githubLinks, userId, extra))
    .orderBy(desc(githubLinks.createdAt));
}

export async function refreshGitHubLink(userId: string, linkId: string) {
  const [existing] = await db
    .select()
    .from(githubLinks)
    .where(withUserScope(githubLinks, userId, eq(githubLinks.id, linkId)))
    .limit(1);

  if (!existing) return null;

  const parsed = parseGitHubUrl(existing.url);
  if (!parsed) return null;

  const token = await getUserGitHubToken(userId);
  const metadata = await fetchGitHubMetadata(parsed, token);

  if (!metadata) return existing;

  const [updated] = await db
    .update(githubLinks)
    .set({
      cachedTitle: metadata.title,
      cachedState: metadata.state,
      syncedAt: new Date(),
    })
    .where(withUserScope(githubLinks, userId, eq(githubLinks.id, linkId)))
    .returning();

  return updated || existing;
}

export async function deleteGitHubLink(userId: string, linkId: string) {
  const [deleted] = await db
    .delete(githubLinks)
    .where(withUserScope(githubLinks, userId, eq(githubLinks.id, linkId)))
    .returning();

  return deleted || null;
}
