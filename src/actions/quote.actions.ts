"use server";

import { db } from "@/db";
import { quotes, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { Client } from "@upstash/workflow";
import { addHours } from "date-fns";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // Max 10 requests per minute
});

const workflowClient = new Client({ token: process.env.QSTASH_TOKEN || "" });
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const QUOTE_EXPIRY_HOURS = 48;

interface QuoteInput {
  title: string;
  description?: string;
  price: number; // in cents
  scheduledDate?: string;
  buyerName?: string;
  buyerPhone?: string;
}

export async function createQuote(data: QuoteInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { success } = await ratelimit.limit(`ratelimit_quotes_${userId}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });
  if (!dbUser) throw new Error("User not found");

  const store = await db.query.stores.findFirst({
    where: eq(stores.userId, dbUser.id),
  });
  if (!store) throw new Error("Store not found");

  const checkoutToken = `QT-${nanoid(10).toUpperCase()}`;

  const [quote] = await db
    .insert(quotes)
    .values({
      storeId: store.id,
      title: data.title,
      description: data.description,
      price: data.price,
      checkoutToken,
      scheduledDate: data.scheduledDate,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      status: "DRAFT",
    })
    .returning();

  revalidatePath("/seller/quotes");
  return { success: true, quote };
}

/**
 * Called when the seller clicks "Send Quote".
 * Moves status DRAFT → SENT, sets expiresAt, and triggers the expiry workflow.
 */
export async function sendQuote(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { success } = await ratelimit.limit(`ratelimit_quotes_${userId}`);
  if (!success) throw new Error("Too many requests. Please try again later.");

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });
  if (!dbUser) throw new Error("User not found");

  // Verify ownership
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { store: true },
  });

  if (!quote) throw new Error("Quote not found");
  if ((quote.store as any).userId !== dbUser.id) throw new Error("Unauthorized");
  if (quote.status !== "DRAFT") throw new Error("Only DRAFT quotes can be sent");

  const expiresAt = addHours(new Date(), QUOTE_EXPIRY_HOURS);

  await db
    .update(quotes)
    .set({ status: "SENT", expiresAt, updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  // Trigger expiry workflow
  if (process.env.QSTASH_TOKEN) {
    workflowClient
      .trigger({
        url: `${APP_URL}/api/workflow/quote-expiry`,
        body: { quoteId, expiresAt: expiresAt.toISOString() },
      })
      .catch(console.error);
  }

  revalidatePath("/seller/quotes");
  return { success: true, expiresAt };
}

/**
 * Cancel a quote (seller-initiated).
 */
export async function cancelQuote(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({
    where: (u) => eq(u.clerkId, userId),
  });
  if (!dbUser) throw new Error("User not found");

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { store: true },
  });
  if (!quote) throw new Error("Quote not found");
  if ((quote.store as any).userId !== dbUser.id) throw new Error("Unauthorized");
  if (!["DRAFT", "SENT"].includes(quote.status)) throw new Error("Cannot cancel this quote");

  await db
    .update(quotes)
    .set({ status: "CANCELLED", updatedAt: new Date() })
    .where(eq(quotes.id, quoteId));

  revalidatePath("/seller/quotes");
  return { success: true };
}
