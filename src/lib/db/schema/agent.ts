import { pgTable, date, integer, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const agentUsage = pgTable(
  "agent_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    usageDate: date("usage_date").notNull(), // YYYY-MM-DD
    requestCount: integer("request_count").default(0).notNull(),
    inputTokens: integer("input_tokens").default(0).notNull(),
    outputTokens: integer("output_tokens").default(0).notNull(),
    estimatedCostMicros: integer("estimated_cost_micros").default(0).notNull(), // 1/1,000,000 USD
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_agent_usage_user_date").on(table.userId, table.usageDate),
  ]
);
