import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { decryptToken, encryptToken } from "./crypto";

/**
 * Encrypts and stores a GitHub access token for a user.
 */
export async function storeUserGitHubToken(
  userId: string,
  rawToken: string
): Promise<void> {
  const { encrypted, iv, tag } = encryptToken(rawToken);

  await db
    .update(accounts)
    .set({
      access_token: encrypted,
      access_token_iv: iv,
      access_token_tag: tag,
    })
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "github")));
}

/**
 * Retrieves and decrypts the GitHub access token for a user.
 * The token is kept strictly in-memory and never sent to clients.
 */
export async function getUserGitHubToken(userId: string): Promise<string | null> {
  const [account] = await db
    .select({
      token: accounts.access_token,
      iv: accounts.access_token_iv,
      tag: accounts.access_token_tag,
    })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "github")))
    .limit(1);

  if (!account || !account.token) {
    return null;
  }

  // If token is encrypted with our IV and Tag
  if (account.iv && account.tag) {
    try {
      return decryptToken(account.token, account.iv, account.tag);
    } catch (err) {
      console.error("Failed to decrypt GitHub token:", err);
      return null;
    }
  }

  // Fallback for unencrypted tokens (if any exist from initial OAuth callback before encryption)
  return account.token;
}
