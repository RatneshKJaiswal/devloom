import { db } from "@/lib/db";
import { tasks, taskDependencies } from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq, and, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface DependencyWithDetails {
  id: string;
  projectId: string;
  predecessorId: string;
  successorId: string;
  predecessorTitle: string;
  predecessorStatus: string;
  successorTitle: string;
  successorStatus: string;
  createdAt: Date;
}

/**
 * Checks whether adding a directed edge (newPred -> newSucc) creates a circular dependency.
 * Traverses forward from newSucc using DFS. If newPred is reachable, a cycle is formed.
 */
export function wouldCreateCycle(
  existingEdges: Array<{ predecessorId: string; successorId: string }>,
  newPred: string,
  newSucc: string
): boolean {
  if (newPred === newSucc) return true;

  // Build adjacency list: node -> array of successors
  const adj = new Map<string, string[]>();
  for (const edge of existingEdges) {
    const list = adj.get(edge.predecessorId) || [];
    list.push(edge.successorId);
    adj.set(edge.predecessorId, list);
  }

  // Add the candidate edge
  const list = adj.get(newPred) || [];
  list.push(newSucc);
  adj.set(newPred, list);

  // DFS to detect reachability of newPred starting from newSucc
  const visited = new Set<string>();
  const stack = [newSucc];

  while (stack.length > 0) {
    const curr = stack.pop()!;
    if (curr === newPred) return true;

    if (!visited.has(curr)) {
      visited.add(curr);
      const neighbors = adj.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }
  }

  return false;
}

export async function listProjectDependencies(
  userId: string,
  projectId: string
): Promise<DependencyWithDetails[]> {
  const predTasks = alias(tasks, "pred_tasks");
  const succTasks = alias(tasks, "succ_tasks");

  const rows = await db
    .select({
      id: taskDependencies.id,
      projectId: taskDependencies.projectId,
      predecessorId: taskDependencies.predecessorId,
      successorId: taskDependencies.successorId,
      predecessorTitle: predTasks.title,
      predecessorStatus: predTasks.status,
      successorTitle: succTasks.title,
      successorStatus: succTasks.status,
      createdAt: taskDependencies.createdAt,
    })
    .from(taskDependencies)
    .innerJoin(predTasks, eq(taskDependencies.predecessorId, predTasks.id))
    .innerJoin(succTasks, eq(taskDependencies.successorId, succTasks.id))
    .where(
      withUserScope(
        taskDependencies,
        userId,
        eq(taskDependencies.projectId, projectId)
      )
    );

  return rows;
}

export async function createTaskDependency(
  userId: string,
  data: {
    projectId: string;
    predecessorId: string;
    successorId: string;
  }
) {
  if (data.predecessorId === data.successorId) {
    throw new Error("Self-dependency is not allowed: a task cannot depend on itself");
  }

  // 1. Verify both tasks exist, belong to user, and belong to the same project
  const candidateTasks = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
    .from(tasks)
    .where(
      withUserScope(
        tasks,
        userId,
        inArray(tasks.id, [data.predecessorId, data.successorId])
      )
    );

  if (candidateTasks.length !== 2) {
    throw new Error("Both tasks must exist and be owned by you");
  }

  for (const t of candidateTasks) {
    if (t.projectId !== data.projectId) {
      throw new Error("Cross-project dependencies are not allowed: both tasks must belong to the same project");
    }
  }

  // 2. Load existing dependencies for this project
  const existing = await db
    .select({
      predecessorId: taskDependencies.predecessorId,
      successorId: taskDependencies.successorId,
    })
    .from(taskDependencies)
    .where(
      withUserScope(
        taskDependencies,
        userId,
        eq(taskDependencies.projectId, data.projectId)
      )
    );

  // Check for duplicate link
  const alreadyExists = existing.some(
    (e) =>
      e.predecessorId === data.predecessorId && e.successorId === data.successorId
  );
  if (alreadyExists) {
    throw new Error("This dependency already exists");
  }

  // 3. Cycle Detection
  if (wouldCreateCycle(existing, data.predecessorId, data.successorId)) {
    throw new Error("Dependency cycle detected: adding this link would create a circular loop");
  }

  // 4. Insert dependency
  const [created] = await db
    .insert(taskDependencies)
    .values({
      userId,
      projectId: data.projectId,
      predecessorId: data.predecessorId,
      successorId: data.successorId,
    })
    .returning();

  return created;
}

export async function deleteTaskDependency(userId: string, dependencyId: string) {
  const [deleted] = await db
    .delete(taskDependencies)
    .where(
      withUserScope(taskDependencies, userId, eq(taskDependencies.id, dependencyId))
    )
    .returning();

  return deleted || null;
}

/**
 * Returns a map of task IDs to their blocked state and list of incomplete predecessors.
 */
export async function getBlockedStatusForProject(
  userId: string,
  projectId: string
): Promise<
  Map<string, { isBlocked: boolean; blockingPredecessors: Array<{ id: string; title: string; status: string }> }>
> {
  const deps = await listProjectDependencies(userId, projectId);
  const statusMap = new Map<
    string,
    { isBlocked: boolean; blockingPredecessors: Array<{ id: string; title: string; status: string }> }
  >();

  for (const dep of deps) {
    const successorEntry = statusMap.get(dep.successorId) || {
      isBlocked: false,
      blockingPredecessors: [],
    };

    if (dep.predecessorStatus !== "done") {
      successorEntry.isBlocked = true;
      successorEntry.blockingPredecessors.push({
        id: dep.predecessorId,
        title: dep.predecessorTitle,
        status: dep.predecessorStatus,
      });
    }

    statusMap.set(dep.successorId, successorEntry);
  }

  return statusMap;
}
