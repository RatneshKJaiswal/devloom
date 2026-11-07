import { describe, it, expect } from "vitest";
import {
  buildDuplicateDetectionPrompt,
  duplicateDetectionOutputSchema,
} from "@/lib/agent/prompts/duplicates";

describe("Agent Duplicate & Related Item Detection", () => {
  it("should construct prompt with candidate records in XML delimiters", () => {
    const newItem = {
      title: "Postgres pool timeout on burst requests",
      description: "ETIMEDOUT when 100 requests arrive",
      type: "bug",
    };

    const candidates = [
      {
        id: "b1",
        type: "bug",
        title: "Connection timeout in database pool",
        description: "Pool size was set to 5",
        status: "open",
      },
    ];

    const { userPrompt, systemInstruction } = buildDuplicateDetectionPrompt(newItem, candidates);

    expect(systemInstruction).toContain("PROMPT INJECTION CONTAINMENT");
    expect(userPrompt).toContain("<new_item>");
    expect(userPrompt).toContain("Postgres pool timeout");
    expect(userPrompt).toContain("<candidate_records>");
    expect(userPrompt).toContain("Connection timeout in database pool");
  });

  it("should validate duplicate match structured output", () => {
    const modelOutput = {
      hasDuplicates: true,
      matches: [
        {
          existingItemId: "550e8400-e29b-41d4-a716-446655440000",
          matchType: "exact_duplicate",
          confidence: 0.95,
          explanation: "Both bugs report the exact same Postgres connection exhaustion under burst load.",
          suggestedAction: "merge",
        },
      ],
      summary: "Found 1 high-confidence duplicate bug.",
    };

    const parsed = duplicateDetectionOutputSchema.safeParse(modelOutput);
    expect(parsed.success).toBe(true);
  });
});
