import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next-auth config before importing api-auth to avoid next/server ESM resolution issue in vitest
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

import {
  generateRawToken,
  hashToken,
  isValidTokenFormat,
  getTokenPrefix,
  calculateExpirationDate,
  PAT_PREFIX,
} from "@/lib/security/pat";
import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import * as tokensDal from "@/lib/dal/tokens";
import { auth } from "@/lib/auth/config";

describe("Personal Access Tokens (PAT) Security & Formats", () => {
  it("should generate tokens with devloom_pat_ prefix and 64-hex entropy", () => {
    const token = generateRawToken();
    expect(token.startsWith(PAT_PREFIX)).toBe(true);
    expect(token).toHaveLength(PAT_PREFIX.length + 64);
    expect(isValidTokenFormat(token)).toBe(true);
  });

  it("should produce deterministic SHA-256 hashes", () => {
    const token = "devloom_pat_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(token);
  });

  it("should validate PAT token formats strictly", () => {
    expect(isValidTokenFormat("invalid_token")).toBe(false);
    expect(isValidTokenFormat("devloom_pat_short")).toBe(false);
    expect(isValidTokenFormat("devloom_pat_" + "g".repeat(64))).toBe(false); // non-hex
    expect(isValidTokenFormat("devloom_pat_" + "a".repeat(64))).toBe(true);
  });

  it("should generate a truncated prefix for UI display", () => {
    const token = "devloom_pat_abcdef01234567891234567890abcdef";
    const prefix = getTokenPrefix(token);
    expect(prefix).toBe("devloom_pat_abcd...");
  });

  it("should calculate expiration dates correctly", () => {
    expect(calculateExpirationDate(null)).toBeNull();
    expect(calculateExpirationDate(undefined)).toBeNull();
    expect(calculateExpirationDate(0)).toBeNull();

    const future = calculateExpirationDate(30);
    expect(future).toBeInstanceOf(Date);
    const diffDays = Math.round((future!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });
});

describe("Unified API Authentication Layer (getAuthenticatedUser)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should authenticate user via valid Authorization Bearer PAT token", async () => {
    vi.spyOn(tokensDal, "verifyPersonalAccessToken").mockResolvedValueOnce({
      id: "usr_123",
      email: "engineer@devloom.local",
      name: "Lead Engineer",
    });

    const fakeToken = "devloom_pat_" + "a".repeat(64);
    const req = new Request("http://localhost:3000/api/tasks", {
      headers: {
        Authorization: `Bearer ${fakeToken}`,
      },
    });

    const user = await getAuthenticatedUser(req);
    expect(user).not.toBeNull();
    expect(user?.id).toBe("usr_123");
    expect(user?.email).toBe("engineer@devloom.local");
    expect(user?.authType).toBe("pat");
  });

  it("should reject when an invalid Bearer token is provided", async () => {
    vi.spyOn(tokensDal, "verifyPersonalAccessToken").mockResolvedValueOnce(null);

    const req = new Request("http://localhost:3000/api/tasks", {
      headers: {
        Authorization: "Bearer devloom_pat_invalidtoken",
      },
    });

    const user = await getAuthenticatedUser(req);
    expect(user).toBeNull();
  });

  it("should fall back to NextAuth session when no Bearer header is present", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: {
        id: "usr_session_456",
        email: "session@devloom.local",
        name: "Session User",
      },
      expires: "2026-12-31",
    } as any);

    const req = new Request("http://localhost:3000/api/tasks");
    const user = await getAuthenticatedUser(req);

    expect(user).not.toBeNull();
    expect(user?.id).toBe("usr_session_456");
    expect(user?.authType).toBe("session");
  });
});
