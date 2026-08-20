import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { db } from "@/db";
import { orders, stores, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendOrderConfirmationBuyer, sendNewOrderSeller } from "@/lib/email";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── checkout.session.completed ────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return NextResponse.json({ received: true });

    // Move order to CONFIRMED_PAID idempotently
    const result = await db.update(orders)
      .set({ status: "CONFIRMED_PAID", updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "PENDING_PAYMENT")))
      .returning({ updatedId: orders.id });

    if (result.length === 0) return NextResponse.json({ received: true });

    // Fetch full order for emails
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { buyer: true, store: { with: { user: true } }, items: true },
    });

    if (order && order.buyer?.email) {
      const scheduledDate = format(new Date(order.scheduledDate + "T12:00:00"), "EEEE, MMMM d, yyyy");
      const emailItems = order.items.map((i) => ({
        name: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      }));

      // Buyer confirmation
      sendOrderConfirmationBuyer({
        buyerEmail: order.buyer.email,
        buyerName: order.buyer.firstName || order.buyer.email,
        storeName: order.store.name,
        orderNumber: order.orderNumber,
        orderId: order.id,
        scheduledDate,
        fulfillmentType: order.fulfillmentType,
        paymentMethod: "STRIPE",
        total: order.total,
        items: emailItems,
      }).catch(console.error);

      // Seller notification
      if (order.store.user?.email) {
        sendNewOrderSeller({
          sellerEmail: order.store.user.email,
          sellerName: order.store.user.firstName || order.store.user.email,
          storeName: order.store.name,
          orderNumber: order.orderNumber,
          orderId: order.id,
          buyerName: `${order.buyer.firstName || ""} ${order.buyer.lastName || ""}`.trim() || order.buyer.email,
          scheduledDate,
          fulfillmentType: order.fulfillmentType,
          paymentMethod: "STRIPE",
          total: order.total,
          items: emailItems,
          buyerNotes: order.buyerNotes || undefined,
        }).catch(console.error);
      }
    }
  }

  // ── account.updated (Stripe Connect onboarding) ───────────────────────────
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    if (account.charges_enabled) {
      await db.update(stores)
        .set({ stripeOnboarded: true })
        .where(eq(stores.stripeAccountId, account.id));
    }
  }

  return NextResponse.json({ received: true });
}
