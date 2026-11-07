import { db } from "@/lib/db";
import { projects, tasks, bugs } from "@/lib/db/schema";
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
  };
  completedVelocity: Array<{
    weekLabel: string;
    completedTasks: number;
  }>;
}

export async function getDashboardAnalytics(userId: string): Promise<DashboardAnalytics> {
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  // Run 3 optimized aggregate queries in parallel
  const [taskStats, bugStats, weeklyTasks] = await Promise.all([
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

    // Query 3: 4-week task completion velocity
    db
      .select({
        weekStart: sql<string>`TO_CHAR(DATE_TRUNC('week', ${tasks.updatedAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(tasks)
      .where(
        withUserScope(
          tasks,
          userId,
          and(
            eq(tasks.status, "done"),
            sql`${tasks.updatedAt} >= ${fourWeeksAgo}`
          )
        )
      )
      .groupBy(sql`DATE_TRUNC('week', ${tasks.updatedAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${tasks.updatedAt})`),
  ]);

  // Transform Query 1 into Due Tasks & Status Distribution
  const dueTasksByProject = taskStats
    .filter((r) => r.overdueCount > 0 || r.dueSoonCount > 0)
    .map((r) => ({
      projectId: r.projectId,
      projectName: r.projectName,
      projectColor: r.projectColor,
      overdueCount: r.overdueCount,
      dueSoonCount: r.dueSoonCount,
      totalOpen: r.overdueCount + r.dueSoonCount,
    }))
    .sort((a, b) => b.totalOpen - a.totalOpen);

  const statusDistributionByProject = taskStats.map((r) => ({
    projectId: r.projectId,
    projectName: r.projectName,
    projectColor: r.projectColor,
    todo: r.todoCount,
    inProgress: r.inProgressCount,
    done: r.doneCount,
    cancelled: r.cancelledCount,
    total: r.totalTasks,
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
    if (row.status in byStatus) {
      byStatus[row.status] += row.count;
    }
    if (row.priority in byPriority) {
      byPriority[row.priority] += row.count;
    }
    totalBugs += row.count;
  }

  // Transform Query 3: generate 4 contiguous weekly buckets
  const weeklyMap = new Map(weeklyTasks.map((w) => [w.weekStart, w.count]));
  const completedVelocity: Array<{ weekLabel: string; completedTasks: number }> = [];

  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    // Find Monday of that week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const key = monday.toISOString().slice(0, 10);
    const label = `Wk ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    completedVelocity.push({
      weekLabel: label,
      completedTasks: weeklyMap.get(key) || 0,
    });
  }

  return {
    dueTasksByProject,
    statusDistributionByProject,
    bugsByStatusAndPriority: {
      byStatus,
      byPriority,
      total: totalBugs,
    },
    completedVelocity,
  };
}
