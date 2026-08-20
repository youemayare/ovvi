import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

/**
 * postgres.js client configured for Supabase Transaction pooler.
 *
 * CRITICAL settings for Supabase:
 * - `prepare: false`  — Transaction pooler does not support prepared statements
 * - `max: 1`          — In serverless, each function invocation is short-lived;
 *                       a pool of 1 prevents connection exhaustion
 */
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });
