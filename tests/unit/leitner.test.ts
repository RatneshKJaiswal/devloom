import { describe, it, expect } from "vitest";

// Replicate Leitner transition algorithm for pure unit testing
const LEITNER_INTERVALS_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
};

function calculateNextReview(currentBox: number, passed: boolean) {
  let nextBox: number;
  let nextStatus: "learning" | "learned" | "mastered";

  if (passed) {
    nextBox = Math.min(currentBox + 1, 5);
    if (nextBox >= 5) {
      nextStatus = "mastered";
    } else if (nextBox >= 4) {
      nextStatus = "learned";
    } else {
      nextStatus = "learning";
    }
  } else {
    nextBox = 1;
    nextStatus = "learning";
  }

  const intervalDays = LEITNER_INTERVALS_DAYS[nextBox] || 1;
  return { nextBox, nextStatus, intervalDays };
}

describe("Leitner Spaced Repetition Engine", () => {
  it("should advance from Box 1 to Box 2 (+3 days) on pass", () => {
    const result = calculateNextReview(1, true);
    expect(result.nextBox).toBe(2);
    expect(result.intervalDays).toBe(3);
    expect(result.nextStatus).toBe("learning");
  });

  it("should advance from Box 3 to Box 4 (+14 days) and mark as learned", () => {
    const result = calculateNextReview(3, true);
    expect(result.nextBox).toBe(4);
    expect(result.intervalDays).toBe(14);
    expect(result.nextStatus).toBe("learned");
  });

  it("should advance to Box 5 (+30 days) and mark as mastered", () => {
    const result = calculateNextReview(4, true);
    expect(result.nextBox).toBe(5);
    expect(result.intervalDays).toBe(30);
    expect(result.nextStatus).toBe("mastered");
  });

  it("should not exceed Box 5 on repeated passes", () => {
    const result = calculateNextReview(5, true);
    expect(result.nextBox).toBe(5);
    expect(result.intervalDays).toBe(30);
    expect(result.nextStatus).toBe("mastered");
  });

  it("should reset to Box 1 (+1 day) and learning status on any failure", () => {
    const failFromBox5 = calculateNextReview(5, false);
    expect(failFromBox5.nextBox).toBe(1);
    expect(failFromBox5.intervalDays).toBe(1);
    expect(failFromBox5.nextStatus).toBe("learning");

    const failFromBox3 = calculateNextReview(3, false);
    expect(failFromBox3.nextBox).toBe(1);
    expect(failFromBox3.intervalDays).toBe(1);
    expect(failFromBox3.nextStatus).toBe("learning");
  });
});
