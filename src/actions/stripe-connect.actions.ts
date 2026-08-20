"use server";

import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function createStripeConnectAccount() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store) throw new Error("Store not found");

  const store = user.store;
  let accountId = store.stripeAccountId;

  // 1. Create a Stripe Express account if they don't have one
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
    });
    accountId = account.id;

    await db.update(stores)
      .set({ stripeAccountId: accountId })
      .where(eq(stores.id, store.id));
  }

  // 2. Create an Account Link for onboarding
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/seller/financials`,
    return_url: `${baseUrl}/seller/connect/callback`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

export async function createStripeLoginLink() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store || !user.store.stripeAccountId) {
    throw new Error("No Stripe account found");
  }

  const loginLink = await stripe.accounts.createLoginLink(user.store.stripeAccountId);
  return { url: loginLink.url };
}
