import { relations } from "drizzle-orm";
import { users } from "./users";
import { stores } from "./stores";
import { products, productVariants, productImages, productTags } from "./products";
import { orders, orderItems } from "./orders";
import { quotes } from "./quotes";
import { reviews, reports } from "./reviews";
import { availabilityRules, blackoutDates } from "./availability";

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, {
    fields: [users.id],
    references: [stores.userId],
  }),
  orders: many(orders),
  quotes: many(quotes),
  reviews: many(reviews),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  user: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  quotes: many(quotes),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  tags: many(productTags),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
  }),
  quote: one(quotes, {
    fields: [orders.quoteId],
    references: [quotes.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  store: one(stores, {
    fields: [quotes.storeId],
    references: [stores.id],
  }),
  buyer: one(users, {
    fields: [quotes.buyerId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  store: one(stores, {
    fields: [reviews.storeId],
    references: [stores.id],
  }),
  buyer: one(users, {
    fields: [reviews.buyerId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));
export const availabilityRulesRelations = relations(availabilityRules, ({ one }) => ({
  store: one(stores, {
    fields: [availabilityRules.storeId],
    references: [stores.id],
  }),
}));

export const blackoutDatesRelations = relations(blackoutDates, ({ one }) => ({
  store: one(stores, {
    fields: [blackoutDates.storeId],
    references: [stores.id],
  }),
}));
export const reportsRelations = relations(reports, ({ one }) => ({
  store: one(stores, {
    fields: [reports.storeId],
    references: [stores.id],
  }),
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
}));
