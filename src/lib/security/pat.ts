import { createHash, randomBytes } from "crypto";

export const PAT_PREFIX = "devloom_pat_";
export const PAT_REGEX = /^devloom_pat_[a-f0-9]{64}$/;

/**
 * Generates a high-entropy Personal Access Token.
 * Format: devloom_pat_<64 hex chars>
 */
export function generateRawToken(): string {
  const entropy = randomBytes(32).toString("hex");
  return `${PAT_PREFIX}${entropy}`;
}

/**
 * Computes the SHA-256 hash of a raw Personal Access Token for secure storage.
 */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Validates whether the given string matches the DevLoom PAT format.
 */
export function isValidTokenFormat(token: string): boolean {
  return PAT_REGEX.test(token);
}

/**
 * Extracts a safe prefix for UI display (e.g. "devloom_pat_8f1a...").
 */
export function getTokenPrefix(rawToken: string): string {
  if (!rawToken.startsWith(PAT_PREFIX)) {
    return `${rawToken.slice(0, 8)}...`;
  }
  return `${rawToken.slice(0, 16)}...`;
}

/**
 * Calculates the expiration date given a duration in days.
 * If expiresInDays is null or undefined or <= 0, the token never expires (returns null).
 */
export function calculateExpirationDate(expiresInDays?: number | null): Date | null {
  if (expiresInDays === null || expiresInDays === undefined || expiresInDays <= 0) {
    return null;
  }
  const date = new Date();
  date.setDate(date.getDate() + expiresInDays);
  return date;
}
