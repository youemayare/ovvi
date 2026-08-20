"use server";

import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function createStripeConnectAccount() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 1. Get the seller's store
  const store = await db.query.stores.findFirst({
    where: (s, { eq }) => eq(s.userId, db.select({ id: stores.userId }).from(stores).where(eq(stores.userId, userId))), // This query is slightly off, we need db user id
  });
  // Wait, the Clerk userId is what we have in auth(). The stores table uses our internal UUID.
  // We need to look up the user first.
  const dbUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.clerkId, userId),
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  const storeRecord = await db.query.stores.findFirst({
    where: (s, { eq }) => eq(s.userId, dbUser.id),
  });

  if (!storeRecord) {
    throw new Error("Store not found");
  }

  let stripeAccountId = storeRecord.stripeAccountId;

  // 2. Create a Stripe account if one doesn't exist
  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // MVP defaults to US
      email: dbUser.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
    });

    stripeAccountId = account.id;

    await db
      .update(stores)
      .set({ stripeAccountId })
      .where(eq(stores.id, storeRecord.id));
  }

  // 3. Create an account link for onboarding
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${appUrl}/seller`,
    return_url: `${appUrl}/seller/onboarding/stripe-return`,
    type: "account_onboarding",
  });

  // 4. Redirect to Stripe
  redirect(accountLink.url);
}
