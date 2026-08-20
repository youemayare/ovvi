import {
  pgTable,
  uuid,
  boolean,
  integer,
  date,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";

/**
 * Weekly recurring availability rules.
 * dayOfWeek: 0 = Sunday, 6 = Saturday
 */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0–6
    isAvailable: boolean("is_available").notNull().default(true),
    maxOrders: integer("max_orders"), // NULL = use store default
  },
  (table) => [
    uniqueIndex("idx_availability_store_day").on(table.storeId, table.dayOfWeek),
    index("idx_availability_rules_store").on(table.storeId),
  ]
);

/**
 * Specific dates where the baker is unavailable (holidays, vacations, etc.)
 */
export const blackoutDates = pgTable(
  "blackout_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    reason: text("reason"),
  },
  (table) => [
    uniqueIndex("idx_blackout_dates_store_date").on(table.storeId, table.date),
    index("idx_blackout_dates_store").on(table.storeId, table.date),
  ]
);

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type BlackoutDate = typeof blackoutDates.$inferSelect;
export type NewBlackoutDate = typeof blackoutDates.$inferInsert;
