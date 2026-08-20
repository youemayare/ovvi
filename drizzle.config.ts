import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for drizzle-kit.");
}

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  /**
   * Verbose logging shows the generated SQL before applying.
   * Always review the migration SQL before running drizzle-kit migrate,
   * especially for the PostGIS geometry column which requires manual inspection.
   */
  verbose: true,
  strict: true,
});
