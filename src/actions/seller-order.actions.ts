"use server";

import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendOrderStatusUpdate } from "@/lib/email";
import { format } from "date-fns";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED_PAID" | "CONFIRMED_CASH" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Find the internal user
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: {
      store: true,
    }
  });

  if (!user || !user.store) {
    throw new Error("Only sellers can update orders");
  }

  // Verify the order belongs to this store
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, orderId),
      eq(orders.storeId, user.store.id)
    ),
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  // Update status (CANCELLED handled separately below to support auto-refund)
  if (newStatus !== "CANCELLED") {
    await db.update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  // If completed, update completedAt
  if (newStatus === "COMPLETED") {
    await db.update(orders)
      .set({ completedAt: new Date() })
      .where(eq(orders.id, orderId));
  }
  
  // If cancelled — auto-refund Stripe payments and mark as REFUNDED instead
  if (newStatus === "CANCELLED") {
    let finalStatus: OrderStatus = "CANCELLED";
    if (order.paymentMethod === "STRIPE" && order.stripePaymentIntentId && stripe) {
      try {
        await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          reason: "requested_by_customer",
        });
        finalStatus = "REFUNDED";
      } catch (err: any) {
        console.error("[Seller Cancel] Stripe refund failed:", err.message);
      }
    }
    await db.update(orders)
      .set({ status: finalStatus, cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    newStatus = finalStatus;
  }

  revalidatePath("/seller/orders");
  revalidatePath(`/seller/orders/${orderId}`);

  const emailStatuses = ["IN_PROGRESS", "READY", "COMPLETED", "CANCELLED", "REFUNDED"];
  if (emailStatuses.includes(newStatus)) {
    const fullOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { buyer: true, store: true },
    });
    if (fullOrder?.buyer?.email) {
      await sendOrderStatusUpdate({
        buyerEmail: fullOrder.buyer.email,
        buyerName: fullOrder.buyer.firstName || fullOrder.buyer.email,
        storeName: fullOrder.store.name,
        orderNumber: fullOrder.orderNumber,
        orderId: fullOrder.id,
        status: newStatus,
      });
    }
  }

  return { success: true };
}
