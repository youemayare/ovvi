import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { storeStatusEnum } from "./enums";

/**
 * PostGIS geometry(Point, 4326) custom type.
 * drizzle-kit does not natively understand PostGIS types, so we define it manually.
 * The migration SQL will need to be reviewed to ensure the type is correct.
 */
const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
});

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // Identity
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  status: storeStatusEnum("status").notNull().default("ONBOARDING"),
  currency: text("currency").notNull().default("USD"),

  // Location
  location: geometry("location"),   // PostGIS GIST index applied in migration
  address: text("address"),
  city: text("city"),
  country: text("country"),

  // Fulfillment
  pickupEnabled: boolean("pickup_enabled").notNull().default(true),
  pickupInstructions: text("pickup_instructions"),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
  deliveryFee: integer("delivery_fee").notNull().default(0), // cents
  deliveryRadius: integer("delivery_radius"), // meters

  // Payments
  cashEnabled: boolean("cash_enabled").notNull().default(true),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboarded: boolean("stripe_onboarded").notNull().default(false),

  // Social
  whatsappNumber: text("whatsapp_number"),
  instagramHandle: text("instagram_handle"),

  // Operations
  leadTimeDays: integer("lead_time_days").notNull().default(2),
  maxOrdersPerDay: integer("max_orders_per_day"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
