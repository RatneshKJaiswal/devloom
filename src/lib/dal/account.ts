import { db } from "@/lib/db";
import {
  users,
  projects,
  projectPhaseHistory,
  projectMilestones,
  tags,
  tasks,
  taskDependencies,
  bugs,
  learnings,
  githubLinks,
} from "@/lib/db/schema";
import { withUserScope } from "./base";
import { eq } from "drizzle-orm";

export async function exportUserData(userId: string) {
  const [userProfile] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      githubUsername: users.githubUsername,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!userProfile) return null;

  const [
    userProjects,
    userPhaseHistory,
    userMilestones,
    userTags,
    userTasks,
    userDependencies,
    userBugs,
    userLearnings,
    userGithubLinks,
  ] = await Promise.all([
    db.select().from(projects).where(withUserScope(projects, userId)),
    db.select().from(projectPhaseHistory).where(withUserScope(projectPhaseHistory, userId)),
    db.select().from(projectMilestones).where(withUserScope(projectMilestones, userId)),
    db.select().from(tags).where(withUserScope(tags, userId)),
    db.select().from(tasks).where(withUserScope(tasks, userId)),
    db.select().from(taskDependencies).where(withUserScope(taskDependencies, userId)),
    db.select().from(bugs).where(withUserScope(bugs, userId)),
    db.select().from(learnings).where(withUserScope(learnings, userId)),
    db.select().from(githubLinks).where(withUserScope(githubLinks, userId)),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.2",
    profile: userProfile,
    data: {
      projects: userProjects,
      phaseHistory: userPhaseHistory,
      milestones: userMilestones,
      tags: userTags,
      tasks: userTasks,
      dependencies: userDependencies,
      bugs: userBugs,
      learnings: userLearnings,
      githubLinks: userGithubLinks,
    },
  };
}

export async function deleteUserAccount(userId: string) {
  // Cascading foreign keys will delete all projects, tags, tasks, bugs, learnings, sessions, and accounts
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning();

  return deleted || null;
}
