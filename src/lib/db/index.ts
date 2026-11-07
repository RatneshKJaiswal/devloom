import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/devloom";

// In serverless environments, keep pool size minimal to avoid connection exhaustion on PgBouncer
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 1 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for PgBouncer transaction pooling mode
});

export const db = drizzle(client, { schema });
