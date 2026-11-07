import { describe, it, expect } from "vitest";
import {
  sdlcPhaseEnum,
  createProjectMilestoneSchema,
  transitionProjectPhaseSchema,
  createProjectSchema,
} from "@/lib/validators";
import { SDLC_PHASES } from "@/lib/tokens";

describe("Project SDLC & Milestones Validation", () => {
  it("validates all 6 SDLC phases", () => {
    for (const phase of SDLC_PHASES) {
      expect(sdlcPhaseEnum.safeParse(phase).success).toBe(true);
    }
    expect(sdlcPhaseEnum.safeParse("invalid_phase").success).toBe(false);
  });

  it("validates phase transition schema", () => {
    const valid = transitionProjectPhaseSchema.safeParse({
      phase: "development",
      notes: "Design sign-off complete",
    });
    expect(valid.success).toBe(true);

    const invalid = transitionProjectPhaseSchema.safeParse({
      phase: "non_existent",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates milestone creation requiring YYYY-MM-DD target date", () => {
    const valid = createProjectMilestoneSchema.safeParse({
      title: "MVP Release Candidate",
      targetDate: "2026-12-01",
    });
    expect(valid.success).toBe(true);

    const invalidDate = createProjectMilestoneSchema.safeParse({
      title: "MVP Release Candidate",
      targetDate: "invalid-date",
    });
    expect(invalidDate.success).toBe(false);

    const emptyTitle = createProjectMilestoneSchema.safeParse({
      title: "",
      targetDate: "2026-12-01",
    });
    expect(emptyTitle.success).toBe(false);
  });

  it("allows projects to specify startDate, targetDate, and currentPhase", () => {
    const valid = createProjectSchema.safeParse({
      name: "New Compiler",
      startDate: "2026-11-01",
      targetDate: "2026-12-31",
      currentPhase: "planning",
    });
    expect(valid.success).toBe(true);
  });
});
