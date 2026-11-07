import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_SECRET_KEY environment variable is not defined");
  }

  // Expecting a 32-byte key (64 hex characters or 32 raw bytes)
  if (secret.length === 64) {
    return Buffer.from(secret, "hex");
  }

  const keyBuffer = Buffer.from(secret, "utf8");
  if (keyBuffer.length === 32) {
    return keyBuffer;
  }

  throw new Error(
    "ENCRYPTION_SECRET_KEY must be exactly 32 bytes (or 64 hex characters)"
  );
}

export interface EncryptedPayload {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Encrypts sensitive data using AES-256-GCM.
 */
export function encryptToken(plainText: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // Standard 12 bytes for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

/**
 * Decrypts sensitive data using AES-256-GCM.
 */
export function decryptToken(encrypted: string, ivHex: string, tagHex: string): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
