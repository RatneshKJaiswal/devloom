import { pgTable, text, timestamp, uuid, primaryKey, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { tags } from "./organization";
import { tasks } from "./tasks";
import { bugs } from "./bugs";
import { learnings } from "./learnings";

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })]
);

export const bugTags = pgTable(
  "bug_tags",
  {
    bugId: uuid("bug_id")
      .notNull()
      .references(() => bugs.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.bugId, t.tagId] })]
);

export const learningTags = pgTable(
  "learning_tags",
  {
    learningId: uuid("learning_id")
      .notNull()
      .references(() => learnings.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.learningId, t.tagId] })]
);

export const entityTypeEnum = pgEnum("entity_type", [
  "task",
  "bug",
  "learning",
]);

export const githubLinkTypeEnum = pgEnum("github_link_type", [
  "issue",
  "pull_request",
  "file",
]);

export const githubLinks = pgTable(
  "github_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    url: text("url").notNull(),
    linkType: githubLinkTypeEnum("link_type").notNull(),
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    issueOrPrNumber: integer("issue_or_pr_number"),
    filePath: text("file_path"),
    cachedTitle: text("cached_title"),
    cachedState: text("cached_state"),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_gh_links_user_entity").on(table.userId, table.entityType, table.entityId),
  ]
);
