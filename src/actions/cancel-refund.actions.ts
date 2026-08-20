"use server";

import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendOrderStatusUpdate } from "@/lib/email";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

const CANCELLABLE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED_CASH", "CONFIRMED_PAID"];

/**
 * Buyer cancels their own order.
 * - Only allowed before the seller starts preparation (PENDING/CONFIRMED states).
 * - Automatically issues a Stripe refund for card-paid orders.
 */
export async function cancelOrderAsBuyer(orderId: string, reason: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user) throw new Error("User not found");

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.buyerId, user.id)),
    with: { store: true },
  });

  if (!order) throw new Error("Order not found");
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw new Error(
      "This order can no longer be cancelled. It may already be in preparation. " +
        "Please contact the baker directly on WhatsApp."
    );
  }

  // Issue Stripe refund if paid by card
  let refunded = false;
  if (order.paymentMethod === "STRIPE" && order.stripePaymentIntentId && stripe) {
    try {
      await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: "requested_by_customer",
      });
      refunded = true;
    } catch (err: any) {
      // If refund fails, still cancel the order but log it
      console.error("[Refund] Stripe refund failed for order", orderId, err.message);
    }
  }

  const newStatus = refunded ? "REFUNDED" : "CANCELLED";

  await db
    .update(orders)
    .set({
      status: newStatus,
      cancelReason: reason,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Notify buyer by email
  if (user.email) {
    await sendOrderStatusUpdate({
      buyerEmail: user.email,
      buyerName: user.firstName || user.email,
      storeName: (order.store as any).name,
      orderNumber: order.orderNumber,
      orderId: order.id,
      status: newStatus,
    }).catch(console.error);
  }

  revalidatePath(`/buyer/orders/${orderId}`);
  revalidatePath("/buyer/orders");

  return { success: true, refunded };
}

/**
 * Seller issues a full refund for a Stripe-paid order.
 * Sets status → REFUNDED.
 */
export async function refundOrderAsSeller(orderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });
  if (!user || !user.store) throw new Error("Only sellers can issue refunds");

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.storeId, user.store.id)),
    with: { buyer: true },
  });

  if (!order) throw new Error("Order not found or unauthorized");
  if (order.paymentMethod !== "STRIPE") {
    throw new Error("Only card-paid orders can be refunded here. For cash orders, handle the refund directly with the customer.");
  }
  if (order.status === "REFUNDED") throw new Error("This order has already been refunded");
  if (!order.stripePaymentIntentId) throw new Error("No payment intent found for this order");
  if (!stripe) throw new Error("Stripe is not configured");

  await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    reason: "requested_by_customer",
  });

  await db
    .update(orders)
    .set({
      status: "REFUNDED",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Notify buyer
  const buyer = (order as any).buyer;
  if (buyer?.email) {
    await sendOrderStatusUpdate({
      buyerEmail: buyer.email,
      buyerName: buyer.firstName || buyer.email,
      storeName: user.store.name,
      orderNumber: order.orderNumber,
      orderId: order.id,
      status: "REFUNDED",
    }).catch(console.error);
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);

  return { success: true };
}
