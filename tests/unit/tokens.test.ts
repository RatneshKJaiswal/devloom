import { describe, it, expect } from "vitest";
import {
  SDLC_PHASES,
  SDLC_PHASE_CONFIG,
  TASK_STATUS_CONFIG,
  BUG_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/tokens";

describe("Design Tokens & Badge Configurations", () => {
  it("defines the fixed 6 SDLC phases", () => {
    expect(SDLC_PHASES).toEqual([
      "planning",
      "design",
      "development",
      "testing",
      "release",
      "maintenance",
    ]);
  });

  it("configures all SDLC phases with badges and color variables", () => {
    for (const phase of SDLC_PHASES) {
      const config = SDLC_PHASE_CONFIG[phase];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.colorVar).toMatch(/^var\(--phase-[a-z]+\)$/);
      expect(config.badgeClass).toContain("border");
    }
  });

  it("configures task statuses with semantic tokens", () => {
    expect(TASK_STATUS_CONFIG.todo).toBeDefined();
    expect(TASK_STATUS_CONFIG.in_progress.badgeClass).toContain("text-primary");
    expect(TASK_STATUS_CONFIG.done.badgeClass).toContain("text-success");
    expect(TASK_STATUS_CONFIG.cancelled.badgeClass).toContain("line-through");
  });

  it("configures bug statuses and priorities", () => {
    expect(BUG_STATUS_CONFIG.open.badgeClass).toContain("text-red-300");
    expect(BUG_STATUS_CONFIG.resolved.badgeClass).toContain("text-success");

    expect(PRIORITY_CONFIG.low).toBeDefined();
    expect(PRIORITY_CONFIG.urgent.badgeClass).toContain("text-red-300");
  });
});
