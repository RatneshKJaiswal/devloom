import { pgTable, text, timestamp, uuid, pgEnum, integer, index } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./organization";

export const reviewStatusEnum = pgEnum("review_status", [
  "new",
  "learning",
  "learned",
  "mastered",
]);

export const learnings = pgTable(
  "learnings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    reviewBox: integer("review_box").default(1).notNull(),
    reviewStatus: reviewStatusEnum("review_status").default("new").notNull(),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }).defaultNow().notNull(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_learnings_user_next_review").on(table.userId, table.nextReviewAt),
    index("idx_learnings_user_project").on(table.userId, table.projectId),
    index("idx_learnings_user_status").on(table.userId, table.reviewStatus),
  ]
);
