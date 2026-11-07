import { describe, it, expect } from "vitest";
import { wouldCreateCycle } from "@/lib/dal/dependencies";
import { createTaskDependencySchema } from "@/lib/validators";

describe("Task Dependencies & Cycle Detection", () => {
  it("rejects direct self-dependencies", () => {
    expect(wouldCreateCycle([], "task-1", "task-1")).toBe(true);
  });

  it("permits valid directed acyclic graph (DAG) edges", () => {
    const existing = [
      { predecessorId: "task-A", successorId: "task-B" },
      { predecessorId: "task-B", successorId: "task-C" },
    ];

    // Candidate: A -> C (shortcut, still DAG)
    expect(wouldCreateCycle(existing, "task-A", "task-C")).toBe(false);

    // Candidate: D -> A (new root, still DAG)
    expect(wouldCreateCycle(existing, "task-D", "task-A")).toBe(false);

    // Candidate: C -> E (leaf, still DAG)
    expect(wouldCreateCycle(existing, "task-C", "task-E")).toBe(false);
  });

  it("detects and rejects direct cycle (B -> A when A -> B exists)", () => {
    const existing = [
      { predecessorId: "task-A", successorId: "task-B" },
    ];

    expect(wouldCreateCycle(existing, "task-B", "task-A")).toBe(true);
  });

  it("detects and rejects multi-hop indirect cycles (C -> A when A -> B -> C exists)", () => {
    const existing = [
      { predecessorId: "task-A", successorId: "task-B" },
      { predecessorId: "task-B", successorId: "task-C" },
    ];

    // Adding C -> A completes the cycle A -> B -> C -> A
    expect(wouldCreateCycle(existing, "task-C", "task-A")).toBe(true);
  });

  it("detects deep indirect cycles across 5 nodes", () => {
    const existing = [
      { predecessorId: "node-1", successorId: "node-2" },
      { predecessorId: "node-2", successorId: "node-3" },
      { predecessorId: "node-3", successorId: "node-4" },
      { predecessorId: "node-4", successorId: "node-5" },
    ];

    expect(wouldCreateCycle(existing, "node-5", "node-1")).toBe(true);
    expect(wouldCreateCycle(existing, "node-5", "node-2")).toBe(true);
    expect(wouldCreateCycle(existing, "node-1", "node-5")).toBe(false); // Valid DAG shortcut
  });

  it("validates dependency creation schema with UUIDs", () => {
    const valid = createTaskDependencySchema.safeParse({
      predecessorId: "550e8400-e29b-41d4-a716-446655440000",
      successorId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(valid.success).toBe(true);

    const invalid = createTaskDependencySchema.safeParse({
      predecessorId: "not-a-uuid",
      successorId: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(invalid.success).toBe(false);
  });
});
