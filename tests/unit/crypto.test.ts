import { describe, it, expect, beforeEach } from "vitest";
import { encryptToken, decryptToken } from "@/lib/security/crypto";

describe("AES-256-GCM Token Encryption", () => {
  const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    process.env.ENCRYPTION_SECRET_KEY = TEST_SECRET;
  });

  it("should encrypt and decrypt a plaintext token successfully", () => {
    const originalToken = "gho_test_github_access_token_123456789";
    const payload = encryptToken(originalToken);

    expect(payload.encrypted).toBeDefined();
    expect(payload.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(payload.tag).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(payload.encrypted).not.toBe(originalToken);

    const decrypted = decryptToken(payload.encrypted, payload.iv, payload.tag);
    expect(decrypted).toBe(originalToken);
  });

  it("should generate distinct ciphertexts for identical plaintexts (random IV)", () => {
    const token = "gho_constant_token";
    const run1 = encryptToken(token);
    const run2 = encryptToken(token);

    expect(run1.iv).not.toBe(run2.iv);
    expect(run1.encrypted).not.toBe(run2.encrypted);
  });

  it("should fail decryption if tag or ciphertext is tampered with", () => {
    const payload = encryptToken("secret_token");
    const corruptedTag = payload.tag.slice(0, -2) + "00";

    expect(() => {
      decryptToken(payload.encrypted, payload.iv, corruptedTag);
    }).toThrow();
  });

  it("should throw if ENCRYPTION_SECRET_KEY is missing", () => {
    delete process.env.ENCRYPTION_SECRET_KEY;
    expect(() => encryptToken("token")).toThrow(
      "ENCRYPTION_SECRET_KEY environment variable is not defined"
    );
  });
});
