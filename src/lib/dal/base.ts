import { and, eq, SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

export interface UserScopedTable extends PgTable {
  userId: AnyPgColumn;
}

/**
 * Enforces multi-tenant data isolation at the DAL boundary.
 * Guarantees that every query condition includes the authenticated user's ID.
 */
export function withUserScope(
  table: UserScopedTable,
  userId: string,
  extraCondition?: SQL
): SQL {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Security Violation: userId is required for all data operations");
  }

  const userCondition = eq(table.userId, userId);
  return extraCondition ? and(userCondition, extraCondition)! : userCondition;
}
