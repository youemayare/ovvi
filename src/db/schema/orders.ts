import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";
import { users } from "./users";
import { products } from "./products";
import { productVariants } from "./products";
import {
  orderStatusEnum,
  paymentMethodEnum,
  fulfillmentTypeEnum,
} from "./enums";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").unique().notNull(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    quoteId: uuid("quote_id"), // FK set after quotes table is defined; added via relation

    // Status & payment
    status: orderStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    fulfillmentType: fulfillmentTypeEnum("fulfillment_type").notNull(),

    // Delivery
    deliveryAddress: text("delivery_address"),
    deliveryFee: integer("delivery_fee").notNull().default(0), // cents

    // Financials (all in cents)
    subtotal: integer("subtotal").notNull(),
    platformFee: integer("platform_fee").notNull().default(0),
    total: integer("total").notNull(),
    depositAmount: integer("deposit_amount").notNull().default(0),
    currency: text("currency").notNull().default("USD"),

    // Stripe (null for cash orders)
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripeTransferId: text("stripe_transfer_id"),

    // Scheduling
    scheduledDate: date("scheduled_date").notNull(),
    scheduledTimeSlot: text("scheduled_time_slot"),
    buyerNotes: text("buyer_notes"),

    // Lifecycle
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_orders_store_status").on(table.storeId, table.status),
    index("idx_orders_buyer").on(table.buyerId),
    index("idx_orders_scheduled_date").on(table.storeId, table.scheduledDate),
    index("idx_orders_stripe_session").on(table.stripeCheckoutSessionId),
  ]
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  // Price snapshots — immutable record of what was ordered
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  unitPrice: integer("unit_price").notNull(), // cents at time of order
  quantity: integer("quantity").notNull().default(1),
  totalPrice: integer("total_price").notNull(), // unitPrice * quantity
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
