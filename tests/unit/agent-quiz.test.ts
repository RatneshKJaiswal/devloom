import { describe, it, expect } from "vitest";
import { buildQuizPrompt, quizOutputSchema } from "@/lib/agent/prompts/quiz";

describe("Agent Learning Quiz Generator", () => {
  it("should construct prompt tailored to box difficulty", () => {
    const foundational = buildQuizPrompt({
      title: "Docker volume permissions",
      content: "Use chown -R 1000:1000 inside entrypoint",
      reviewBox: 2,
    });

    expect(foundational.userPrompt).toContain("Foundational (User is in Box 1-3");
    expect(foundational.systemInstruction).toContain("Spaced Review Quizmaster");

    const advanced = buildQuizPrompt({
      title: "Raft consensus election timeouts",
      content: "Leader heartbeats must be significantly faster than election timeout",
      reviewBox: 5,
    });

    expect(advanced.userPrompt).toContain("Advanced / Scenario-based (User is in Box 4/5");
  });

  it("should validate quiz structured output", () => {
    const modelOutput = {
      question: "Why should leader heartbeats be sent at intervals shorter than the election timeout in Raft?",
      hints: ["Think about split votes and network jitter", "What triggers follower node elections?"],
      explanation: "If heartbeats are too slow, followers mistake the leader for failed and trigger election storms.",
      practicalScenario: "Diagnosing flapping leadership in an unstable cloud network.",
    };

    const parsed = quizOutputSchema.safeParse(modelOutput);
    expect(parsed.success).toBe(true);
  });
});
