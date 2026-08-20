import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["BUYER", "SELLER", "ADMIN"]);

export const storeStatusEnum = pgEnum("store_status", [
  "ONBOARDING",
  "PENDING_REVIEW",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING_PAYMENT",
  "CONFIRMED_PAID",
  "CONFIRMED_CASH",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["STRIPE", "CASH"]);

export const fulfillmentTypeEnum = pgEnum("fulfillment_type", [
  "PICKUP",
  "DELIVERY",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "EXPIRED",
  "CANCELLED",
]);

export const productTypeEnum = pgEnum("product_type", ["STANDARD", "CUSTOM"]);

export const reportStatusEnum = pgEnum("report_status", [
  "OPEN",
  "REVIEWED",
  "RESOLVED",
]);
