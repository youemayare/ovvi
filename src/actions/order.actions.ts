"use server";

import { db } from "@/db";
import { orders, orderItems, stores, users, products, productVariants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { nanoid } from "nanoid";
import { format } from "date-fns";
import { sendOrderConfirmationBuyer, sendNewOrderSeller } from "@/lib/email";
import { Client } from "@upstash/workflow";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // Max 5 requests per minute
});

const workflowClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" as any })
  : null;

interface OrderInput {
  storeId: string;
  items: {
    productId: string;
    variantId: string | null;
    productName: string;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
  }[];
  paymentMethod: "STRIPE" | "CASH";
  fulfillmentType: "PICKUP" | "DELIVERY";
  scheduledDate: string; // YYYY-MM-DD
  scheduledTimeSlot?: string;
  deliveryAddress?: string;
  buyerNotes?: string;
}

export async function createOrder(data: OrderInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in to place an order.");
  }

  const { success } = await ratelimit.limit(`ratelimit_orders_${userId}`);
  if (!success) {
    throw new Error("Too many requests. Please try again later.");
  }

  let dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });

  if (!dbUser) {
    // Auto-create user record for new signups
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    const [newUser] = await db.insert(users).values({
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "no-email@example.com",
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    }).returning();
    
    dbUser = newUser;
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, data.storeId),
  });

  if (!store) {
    throw new Error("Store not found");
  }

  // Calculate totals securely using DB data
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of data.items) {
    const dbProduct = await db.query.products.findFirst({ 
      where: eq(products.id, item.productId) 
    });
    
    if (!dbProduct) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    if (dbProduct.basePrice === null) {
      throw new Error(`Product ${item.productId} has no base price and cannot be purchased directly.`);
    }
    
    let realPrice: number = dbProduct.basePrice;

    if (item.variantId) {
      const dbVariant = await db.query.productVariants.findFirst({
        where: and(
          eq(productVariants.id, item.variantId),
          eq(productVariants.productId, item.productId)
        )
      });
      if (dbVariant) {
        realPrice += dbVariant.priceModifier;
      }
    }
    
    subtotal += realPrice * item.quantity;
    verifiedItems.push({ ...item, unitPrice: realPrice });
  }

  const deliveryFee = data.fulfillmentType === "DELIVERY" ? (store.deliveryFee || 0) : 0;
  // Ovvi takes a 10% platform fee
  const platformFee = Math.round(subtotal * 0.10);
  const total = subtotal + deliveryFee + platformFee;

  // Insert Order
  const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;
  const initialStatus = data.paymentMethod === "CASH" ? "CONFIRMED_CASH" : "PENDING_PAYMENT";

  const [order] = await db.insert(orders).values({
    orderNumber,
    storeId: data.storeId,
    buyerId: dbUser.id,
    status: initialStatus,
    paymentMethod: data.paymentMethod,
    fulfillmentType: data.fulfillmentType,
    deliveryAddress: data.fulfillmentType === "DELIVERY" ? data.deliveryAddress : null,
    deliveryFee,
    subtotal,
    platformFee,
    total,
    scheduledDate: data.scheduledDate,
    scheduledTimeSlot: data.scheduledTimeSlot,
    buyerNotes: data.buyerNotes,
  }).returning();

  // Insert Order Items
  const itemsToInsert = verifiedItems.map(item => ({
    orderId: order.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName,
    variantName: item.variantName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    totalPrice: item.unitPrice * item.quantity,
  }));

  await db.insert(orderItems).values(itemsToInsert);

  // Dual-Path Payment State Machine
  if (data.paymentMethod === "CASH") {
    const scheduledDateFormatted = format(
      new Date(data.scheduledDate + "T12:00:00"),
      "EEEE, MMMM d, yyyy"
    );
    const emailItems = verifiedItems.map((i) => ({
      name: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
      quantity: i.quantity,
      totalPrice: i.unitPrice * i.quantity,
    }));

    // Fetch seller user for notification
    const sellerUser = await db.query.users.findFirst({
      where: eq(users.id, store.userId),
    });

    // Send both emails concurrently — awaited so they finish before redirect
    await Promise.all([
      sendOrderConfirmationBuyer({
        buyerEmail: dbUser.email,
        buyerName: dbUser.firstName || dbUser.email,
        storeName: store.name,
        orderNumber: order.orderNumber,
        orderId: order.id,
        scheduledDate: scheduledDateFormatted,
        fulfillmentType: data.fulfillmentType,
        paymentMethod: "CASH",
        total,
        items: emailItems,
      }),
      sellerUser?.email
        ? sendNewOrderSeller({
            sellerEmail: sellerUser.email,
            sellerName: sellerUser.firstName || sellerUser.email,
            storeName: store.name,
            orderNumber: order.orderNumber,
            orderId: order.id,
            buyerName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || dbUser.email,
            scheduledDate: scheduledDateFormatted,
            fulfillmentType: data.fulfillmentType,
            paymentMethod: "CASH",
            total,
            items: emailItems,
            buyerNotes: data.buyerNotes,
          })
        : Promise.resolve(),
    ]);

    // Trigger order lifecycle workflow (fire-and-forget is OK here)
    if (process.env.QSTASH_TOKEN) {
      workflowClient
        .trigger({
          url: `${APP_URL}/api/workflow/order-lifecycle`,
          body: { orderId: order.id },
        })
        .catch(console.error);
    }

    return { success: true, url: `/order/${order.id}/success` };

  } else {
    // PATH A: Stripe
    if (!stripe) {
      throw new Error("Stripe is not configured in this environment.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${appUrl}/order/${order.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/store/${store.slug}/checkout?cancel=true`,
      metadata: {
        orderId: order.id,
      },
      line_items: [
        ...verifiedItems.map(item => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${item.productName} ${item.variantName ? `(${item.variantName})` : ""}`,
            },
            unit_amount: item.unitPrice,
          },
          quantity: item.quantity,
        })),
        ...(deliveryFee > 0 ? [{
          price_data: {
            currency: "usd",
            product_data: { name: "Delivery Fee" },
            unit_amount: deliveryFee,
          },
          quantity: 1,
        }] : []),
        ...(platformFee > 0 ? [{
          price_data: {
            currency: "usd",
            product_data: { name: "Service Fee" },
            unit_amount: platformFee,
          },
          quantity: 1,
        }] : [])
      ],
    });

    // Update order with Stripe Session ID
    await db.update(orders)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(orders.id, order.id));

    return { success: true, url: session.url };
  }
}
