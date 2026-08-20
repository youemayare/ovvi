import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";
import { users } from "./users";
import { orders } from "./orders";
import { quoteStatusEnum } from "./enums";

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    // buyerId is NULL until the buyer authenticates via the checkout link
    buyerId: uuid("buyer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Once accepted, this links the quote to its resulting order
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),

    // Content
    title: text("title").notNull(),
    description: text("description"),
    price: integer("price").notNull(), // cents
    currency: text("currency").notNull().default("USD"),

    // State
    status: quoteStatusEnum("status").notNull().default("DRAFT"),

    // The unique token used in the checkout URL: /quote/[checkoutToken]
    checkoutToken: text("checkout_token").unique(),

    // Scheduling
    scheduledDate: date("scheduled_date"),

    // Expiry (managed by Upstash Workflow)
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Buyer info pre-filled by baker from WhatsApp chat
    buyerName: text("buyer_name"),
    buyerPhone: text("buyer_phone"),

    // Lifecycle
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_quotes_store").on(table.storeId),
    index("idx_quotes_checkout_token").on(table.checkoutToken),
  ]
);

export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
