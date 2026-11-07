import { db } from "@/lib/db";
import { personalAccessTokens, users } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { and, desc, eq, gt, or, isNull, sql } from "drizzle-orm";
import {
  generateRawToken,
  hashToken,
  getTokenPrefix,
  calculateExpirationDate,
  isValidTokenFormat,
} from "@/lib/security/pat";

export interface TokenSummary {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreatedTokenResponse extends TokenSummary {
  token: string; // The cleartext token, returned ONLY ONCE upon creation
}

/**
 * List all personal access tokens for the authenticated user.
 * Strips the tokenHash to prevent sensitive credential exposure.
 */
export async function listPersonalAccessTokens(userId: string): Promise<TokenSummary[]> {
  const rows = await db
    .select({
      id: personalAccessTokens.id,
      name: personalAccessTokens.name,
      tokenPrefix: personalAccessTokens.tokenPrefix,
      lastUsedAt: personalAccessTokens.lastUsedAt,
      expiresAt: personalAccessTokens.expiresAt,
      createdAt: personalAccessTokens.createdAt,
    })
    .from(personalAccessTokens)
    .where(withUserScope(personalAccessTokens, userId))
    .orderBy(desc(personalAccessTokens.createdAt));

  return rows;
}

/**
 * Create a new personal access token.
 * Returns the unhashed token exactly once.
 */
export async function createPersonalAccessToken(
  userId: string,
  name: string,
  expiresInDays: number | null = 90
): Promise<CreatedTokenResponse> {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 64) {
    throw new Error("Token name must be between 1 and 64 characters");
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const tokenPrefix = getTokenPrefix(rawToken);
  const expiresAt = calculateExpirationDate(expiresInDays);

  const [inserted] = await db
    .insert(personalAccessTokens)
    .values({
      userId,
      name: trimmedName,
      tokenHash,
      tokenPrefix,
      expiresAt,
    })
    .returning({
      id: personalAccessTokens.id,
      name: personalAccessTokens.name,
      tokenPrefix: personalAccessTokens.tokenPrefix,
      lastUsedAt: personalAccessTokens.lastUsedAt,
      expiresAt: personalAccessTokens.expiresAt,
      createdAt: personalAccessTokens.createdAt,
    });

  return {
    ...inserted,
    token: rawToken,
  };
}

/**
 * Revokes a personal access token by ID, strictly scoped to the user.
 */
export async function revokePersonalAccessToken(userId: string, tokenId: string): Promise<boolean> {
  const result = await db
    .delete(personalAccessTokens)
    .where(withUserScope(personalAccessTokens, userId, eq(personalAccessTokens.id, tokenId)))
    .returning({ id: personalAccessTokens.id });

  return result.length > 0;
}

/**
 * Verifies a raw personal access token from an Authorization: Bearer header.
 * Returns the associated user record if valid and not expired.
 * Updates lastUsedAt asynchronously.
 */
export async function verifyPersonalAccessToken(rawToken: string): Promise<{
  id: string;
  email: string | null;
  name: string | null;
} | null> {
  if (!isValidTokenFormat(rawToken)) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [row] = await db
    .select({
      tokenId: personalAccessTokens.id,
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(personalAccessTokens)
    .innerJoin(users, eq(personalAccessTokens.userId, users.id))
    .where(
      and(
        eq(personalAccessTokens.tokenHash, tokenHash),
        or(isNull(personalAccessTokens.expiresAt), gt(personalAccessTokens.expiresAt, now))
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  // Record usage asynchronously without blocking API response
  db.update(personalAccessTokens)
    .set({ lastUsedAt: now })
    .where(eq(personalAccessTokens.id, row.tokenId))
    .catch((err) => {
      console.warn("Failed to update token lastUsedAt:", err);
    });

  return {
    id: row.userId,
    email: row.email,
    name: row.name,
  };
}
