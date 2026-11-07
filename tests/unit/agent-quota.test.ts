import { describe, it, expect } from "vitest";
import { checkInputSize, MAX_INPUT_CHARACTERS, getTodayDateString } from "@/lib/agent/quota";

describe("Agent Cost Controls & Quota Guardrails", () => {
  it("should format today date string in YYYY-MM-DD format", () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should accept inputs within the 8,000 character limit", () => {
    const normalInput = "TypeError: Cannot read properties of undefined";
    const error = checkInputSize(normalInput);
    expect(error).toBeNull();

    const maxInput = "a".repeat(MAX_INPUT_CHARACTERS);
    expect(checkInputSize(maxInput)).toBeNull();
  });

  it("should reject inputs exceeding the 8,000 character limit", () => {
    const oversizedInput = "a".repeat(MAX_INPUT_CHARACTERS + 1);
    const error = checkInputSize(oversizedInput);

    expect(error).not.toBeNull();
    expect(error?.code).toBe("INPUT_TOO_LARGE");
    expect(error?.retryable).toBe(false);
  });
});
