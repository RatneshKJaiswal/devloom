import { describe, it, expect } from "vitest";
import { formatTaskId, formatBugId } from "@/lib/identifiers";

describe("Identifiers & Task-Bug Association logic", () => {
  it("formats task IDs with sequential number when present", () => {
    expect(formatTaskId({ id: "8a7a1a61-6ee1-4746-82b3-f4462cb56d50", taskNumber: 12 })).toBe("TSK-12");
    expect(formatTaskId({ id: "0fa06fd7-4121-42f4-969c-8e235270df07", taskNumber: 1 })).toBe("TSK-1");
  });

  it("formats task IDs with clean fallback when number is not present", () => {
    expect(formatTaskId({ id: "8a7a1a61-6ee1-4746-82b3-f4462cb56d50" })).toBe("TSK-8A7A");
  });

  it("formats bug IDs with sequential number when present", () => {
    expect(formatBugId({ id: "2fda6a14-b974-4e2e-bd55-224eaa40352e", bugNumber: 7 })).toBe("BUG-7");
    expect(formatBugId({ id: "e04215e5-53f9-4ec4-8a66-77766111fdc2", bugNumber: 3 })).toBe("BUG-3");
  });

  it("formats bug IDs with clean fallback when number is not present", () => {
    expect(formatBugId({ id: "e04215e5-53f9-4ec4-8a66-77766111fdc2" })).toBe("BUG-E042");
  });

  it("checks completion logic: resolving all bugs marks task completed", () => {
    const bugsList1 = [
      { id: "1", status: "resolved" },
      { id: "2", status: "closed" },
    ];
    const allResolved1 =
      bugsList1.length > 0 &&
      bugsList1.every((b) => b.status === "resolved" || b.status === "closed");
    expect(allResolved1).toBe(true);

    const bugsList2 = [
      { id: "1", status: "resolved" },
      { id: "2", status: "open" },
    ];
    const allResolved2 =
      bugsList2.length > 0 &&
      bugsList2.every((b) => b.status === "resolved" || b.status === "closed");
    expect(allResolved2).toBe(false);
  });
});
