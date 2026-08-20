import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/marketplace/checkout-form";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout | Ovvi",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  // Enforce authentication at checkout
  const { userId } = await auth();
  if (!userId) {
    // If we wanted to preserve state, we'd add a return url
    redirect(`/sign-in?redirect_url=/store/${slug}/checkout`);
  }

  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, slug),
  });

  if (!store) {
    notFound();
  }

  return (
    <div className="bg-stone-50 min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <Link 
            href={`/store/${store.slug}`}
            className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 transition"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {store.name} menu
          </Link>
          <h1 className="text-3xl font-display font-bold text-stone-900 mt-4">Checkout</h1>
        </div>
        
        <CheckoutForm store={{
          id: store.id,
          slug: store.slug,
          name: store.name,
          cashEnabled: store.cashEnabled ?? false,
          pickupEnabled: store.pickupEnabled ?? false,
          deliveryEnabled: store.deliveryEnabled ?? false,
          deliveryFee: store.deliveryFee ?? 0,
          pickupInstructions: store.pickupInstructions,
        }} />
      </div>
    </div>
  );
}
