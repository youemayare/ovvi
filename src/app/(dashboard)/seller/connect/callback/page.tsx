import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { Loader2 } from "lucide-react";

export default async function StripeConnectCallbackPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store || !user.store.stripeAccountId) {
    redirect("/seller/financials");
  }

  // Check the account status synchronously
  // (Webhooks might be delayed, so we check on return to update the UI instantly)
  try {
    const account = await stripe.accounts.retrieve(user.store.stripeAccountId);
    
    if (account.charges_enabled && !user.store.stripeOnboarded) {
      await db.update(stores)
        .set({ stripeOnboarded: true })
        .where(eq(stores.id, user.store.id));
    }
  } catch (err) {
    console.error("Failed to retrieve Stripe account on callback:", err);
  }

  // Redirect back to financials page
  redirect("/seller/financials");

  // Fallback UI (redirect happens on the server, so this is rarely seen)
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="text-stone-500 font-medium">Syncing your account...</p>
    </div>
  );
}
