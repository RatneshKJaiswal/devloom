import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const sdlcPhaseEnum = pgEnum("sdlc_phase", [
  "planning",
  "design",
  "development",
  "testing",
  "release",
  "maintenance",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#6366F1").notNull(),
    currentPhase: sdlcPhaseEnum("current_phase").default("planning").notNull(),
    startDate: text("start_date"), // Date-only YYYY-MM-DD
    targetDate: text("target_date"), // Date-only YYYY-MM-DD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_projects_user").on(table.userId),
    uniqueIndex("idx_projects_user_name").on(table.userId, table.name),
  ]
);

export const projectPhaseHistory = pgTable(
  "project_phase_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    phase: sdlcPhaseEnum("phase").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("idx_phase_history_user_project").on(table.userId, table.projectId),
  ]
);

export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    targetDate: text("target_date").notNull(), // Date-only YYYY-MM-DD
    isCompleted: boolean("is_completed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_milestones_user_project").on(table.userId, table.projectId),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#64748B").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_tags_user").on(table.userId),
    uniqueIndex("idx_tags_user_name").on(table.userId, table.name),
  ]
);
