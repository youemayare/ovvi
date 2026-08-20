import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { ClearCartOnMount } from "@/components/marketplace/clear-cart-on-mount";

export const metadata: Metadata = {
  title: "Order Placed Successfully | Ovvi",
};

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      store: true,
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <ClearCartOnMount />
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-200 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-4">
          Order Placed Successfully!
        </h1>
        
        <p className="text-stone-600 mb-8 text-lg">
          Thank you for your order. We've sent the details to <span className="font-semibold text-stone-900">{order.store.name}</span>.
        </p>

        <div className="bg-stone-50 rounded-2xl p-6 text-left mb-8 border border-stone-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-stone-500 mb-1">Order Number</p>
              <p className="font-semibold text-stone-900">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Total Amount</p>
              <p className="font-semibold text-stone-900">${(order.total / 100).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Fulfillment</p>
              <p className="font-semibold text-stone-900 capitalize">{order.fulfillmentType.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Payment</p>
              <p className="font-semibold text-stone-900 capitalize">{order.paymentMethod.toLowerCase()}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto h-12 px-8">
            <Link href="/marketplace">
              Return to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8">
            <Link href={`/store/${order.store.slug}`}>
              Back to {order.store.name}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
