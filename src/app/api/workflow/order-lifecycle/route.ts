import { serve } from "@upstash/workflow/nextjs";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderStatusUpdate, sendReviewPrompt } from "@/lib/email";
import { format, subDays } from "date-fns";

/**
 * Order lifecycle workflow.
 * Triggered when an order is confirmed (cash or Stripe).
 *
 * Steps:
 *   1. Sleep until the day before the scheduled date — send the seller a reminder.
 *   2. After COMPLETED status — sleep 24h — send the buyer a review prompt.
 *
 * Trigger: POST /api/workflow/order-lifecycle
 * Body: { orderId: string }
 */
export const { POST } = serve<{ orderId: string }>(async (context) => {
  const { orderId } = context.requestPayload;

  // Fetch the order
  const order = await context.run("fetch-order", async () => {
    return db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { buyer: true, store: { with: { user: true } }, items: true },
    });
  });

  if (!order) return;

  // ── Step 1: Order reminder to seller (day before pickup) ─────────────────
  const scheduledAt = new Date(order.scheduledDate + "T09:00:00");
  const reminderAt = subDays(scheduledAt, 1);

  // Only sleep if the reminder date is in the future
  if (reminderAt > new Date()) {
    await context.sleepUntil("wait-for-reminder", reminderAt);

    await context.run("send-seller-reminder", async () => {
      // Re-fetch to check if order was cancelled
      const current = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
      if (!current || ["CANCELLED", "REFUNDED", "COMPLETED"].includes(current.status)) return;

      const sellerEmail = (order.store as any).user?.email;
      if (!sellerEmail) return;

      // Send a plain reminder — reuse status email with a custom pseudo-status
      await sendOrderStatusUpdate({
        buyerEmail: sellerEmail,
        buyerName: (order.store as any).user?.firstName || "there",
        storeName: order.store.name,
        orderNumber: order.orderNumber,
        orderId: order.id,
        status: "REMINDER", // handled gracefully by the template's default branch
      });
    });
  }

  // ── Step 2: Review prompt to buyer (24h after completion) ─────────────────
  // Poll until order is completed (max 30 days) or bailed
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    const current = await context.run(`poll-completion-${attempts}`, async () => {
      return db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { buyer: true },
      });
    });

    if (!current) break;
    if (["CANCELLED", "REFUNDED"].includes(current.status)) break;

    if (current.status === "COMPLETED") {
      // Sleep 24 hours
      await context.sleep("wait-24h-after-completion", 60 * 60 * 24);

      await context.run("send-review-prompt", async () => {
        const buyer = (current as any).buyer;
        if (!buyer?.email) return;
        await sendReviewPrompt({
          buyerEmail: buyer.email,
          buyerName: buyer.firstName || buyer.email,
          storeName: order.store.name,
          orderNumber: order.orderNumber,
          orderId: order.id,
        });
      });
      break;
    }

    // Not completed yet — wait 6 hours and poll again
    await context.sleep(`wait-poll-${attempts}`, 60 * 60 * 6);
    attempts++;
  }
});
