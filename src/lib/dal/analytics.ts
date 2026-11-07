import { db } from "@/lib/db";
import { projects, tasks, bugs } from "@/lib/db/schema";
import { getUserQuotaUsage } from "@/lib/agent/quota";
import { withUserScope } from "./base";
import { eq, sql, and } from "drizzle-orm";

export interface DashboardAnalytics {
  dueTasksByProject: Array<{
    projectId: string | null;
    projectName: string;
    projectColor: string;
    overdueCount: number;
    dueSoonCount: number;
    totalOpen: number;
  }>;
  statusDistributionByProject: Array<{
    projectId: string | null;
    projectName: string;
    projectColor: string;
    todo: number;
    inProgress: number;
    done: number;
    cancelled: number;
    total: number;
  }>;
  bugsByStatusAndPriority: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    total: number;
    totalOpen: number;
  };
  completedVelocity: Array<{
    weekLabel: string;
    completedTasks: number;
  }>;
  totalActiveTasks: number;
  agentQuota?: {
    usedRequests: number;
    maxRequests: number;
    remainingRequests: number;
    usedTokens: number;
    maxTokens: number;
  };
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
  // Run queries in parallel including real-time agent quota
  const [taskStats, bugStats, completedTaskRows, agentQuota] = await Promise.all([
    // Query 1: Project-scoped task aggregates (Overdue, Due Soon, Status Breakdown)
    db
      .select({
        projectId: tasks.projectId,
        projectName: sql<string>`COALESCE(${projects.name}, 'No Project')`,
        projectColor: sql<string>`COALESCE(${projects.color}, '#64748B')`,
        totalTasks: sql<number>`count(*)::int`,
        overdueCount: sql<number>`count(*) FILTER (WHERE ${tasks.status} != 'done' AND ${tasks.status} != 'cancelled' AND ${tasks.dueDate} < CURRENT_DATE)::int`,
        dueSoonCount: sql<number>`count(*) FILTER (WHERE ${tasks.status} != 'done' AND ${tasks.status} != 'cancelled' AND ${tasks.dueDate} >= CURRENT_DATE AND ${tasks.dueDate} <= CURRENT_DATE + INTERVAL '7 days')::int`,
        todoCount: sql<number>`count(*) FILTER (WHERE ${tasks.status} = 'todo')::int`,
        inProgressCount: sql<number>`count(*) FILTER (WHERE ${tasks.status} = 'in_progress')::int`,
        doneCount: sql<number>`count(*) FILTER (WHERE ${tasks.status} = 'done')::int`,
        cancelledCount: sql<number>`count(*) FILTER (WHERE ${tasks.status} = 'cancelled')::int`,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(withUserScope(tasks, userId))
      .groupBy(tasks.projectId, projects.name, projects.color),

    // Query 2: Bugs grouped by status and priority
    db
      .select({
        status: bugs.status,
        priority: bugs.priority,
        count: sql<number>`count(*)::int`,
      })
      .from(bugs)
      .where(withUserScope(bugs, userId))
      .groupBy(bugs.status, bugs.priority),

    // Query 3: Completed tasks in past 4 weeks (safely bucketed in JS)
    db
      .select({
        completedAt: tasks.completedAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(
        withUserScope(
          tasks,
          userId,
          and(
            eq(tasks.status, "done"),
            sql`COALESCE(${tasks.completedAt}, ${tasks.updatedAt}) >= NOW() - INTERVAL '28 days'`
          )
        )
      ),

    // Query 4: Live Agent Quota consumption
    getUserQuotaUsage(userId).catch(() => ({
      usedRequests: 0,
      maxRequests: 50,
      remainingRequests: 50,
      usedTokens: 0,
      maxTokens: 100000,
    })),
  ]);

  // Transform Query 1 into Due Tasks & Status Distribution
  const dueTasksByProject = taskStats
    .map((r) => {
      const overdue = Number(r.overdueCount) || 0;
      const dueSoon = Number(r.dueSoonCount) || 0;
      return {
        projectId: r.projectId,
        projectName: r.projectName,
        projectColor: r.projectColor,
        overdueCount: overdue,
        dueSoonCount: dueSoon,
        totalOpen: overdue + dueSoon,
      };
    })
    .filter((r) => r.overdueCount > 0 || r.dueSoonCount > 0)
    .sort((a, b) => b.totalOpen - a.totalOpen);

  const statusDistributionByProject = taskStats.map((r) => ({
    projectId: r.projectId,
    projectName: r.projectName,
    projectColor: r.projectColor,
    todo: Number(r.todoCount) || 0,
    inProgress: Number(r.inProgressCount) || 0,
    done: Number(r.doneCount) || 0,
    cancelled: Number(r.cancelledCount) || 0,
    total: Number(r.totalTasks) || 0,
  }));

  // Transform Query 2 into Bug stats
  const byStatus: Record<string, number> = {
    open: 0,
    confirmed: 0,
    fixing: 0,
    resolved: 0,
    closed: 0,
    wont_fix: 0,
  };
  const byPriority: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };
  let totalBugs = 0;

  for (const row of bugStats) {
    const count = Number(row.count) || 0;
    if (row.status && row.status in byStatus) {
      byStatus[row.status] = (byStatus[row.status] || 0) + count;
    }
    if (row.priority && row.priority in byPriority) {
      byPriority[row.priority] = (byPriority[row.priority] || 0) + count;
    }
    totalBugs += count;
  }

  const totalOpen =
    (byStatus.open || 0) +
    (byStatus.confirmed || 0) +
    (byStatus.fixing || 0);

  // Transform Query 3: bucket completed tasks into past 4 rolling weeks
  const now = new Date();
  const completedVelocity: Array<{ weekLabel: string; completedTasks: number }> = [];

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const label = `Wk ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    const count = completedTaskRows.filter((t) => {
      const taskDate = new Date(t.completedAt ?? t.updatedAt);
      return taskDate >= weekStart && taskDate < weekEnd;
    }).length;

    completedVelocity.push({
      weekLabel: label,
      completedTasks: count,
    });
  }

  const totalActiveTasks = taskStats.reduce(
    (sum, r) => sum + (Number(r.todoCount) || 0) + (Number(r.inProgressCount) || 0),
    0
  );

  return {
    dueTasksByProject,
    statusDistributionByProject,
    bugsByStatusAndPriority: {
      byStatus,
      byPriority,
      total: totalBugs,
      totalOpen,
    },
    completedVelocity,
    totalActiveTasks,
    agentQuota,
  };
}
