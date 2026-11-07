import { pgTable, text, timestamp, uuid, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { projects } from "./organization";
import { priorityEnum } from "./tasks";

export const bugStatusEnum = pgEnum("bug_status", [
  "open",
  "confirmed",
  "fixing",
  "resolved",
  "closed",
  "wont_fix",
]);

export const bugs = pgTable(
  "bugs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    stackTrace: text("stack_trace"),
    reproSteps: text("repro_steps"),
    suspectedCause: text("suspected_cause"),
    status: bugStatusEnum("status").default("open").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_bugs_user_status").on(table.userId, table.status),
    index("idx_bugs_user_project").on(table.userId, table.projectId),
    index("idx_bugs_user_due").on(table.userId, table.dueDate),
  ]
);
