import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowRight, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | Ovvi",
  description: "Track and view your order history on Ovvi.",
};

function getStatusDetails(status: string): { label: string; color: string } {
  switch (status) {
    case "PENDING_PAYMENT":
      return { label: "Pending Payment", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    case "CONFIRMED_CASH":
      return { label: "Confirmed — Pay on pickup", color: "text-blue-700 bg-blue-50 border-blue-200" };
    case "CONFIRMED_PAID":
      return { label: "Payment Confirmed", color: "text-green-700 bg-green-50 border-green-200" };
    case "IN_PROGRESS":
      return { label: "Being Prepared", color: "text-purple-700 bg-purple-50 border-purple-200" };
    case "READY":
      return { label: "Ready for Pickup", color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
    case "COMPLETED":
      return { label: "Completed", color: "text-stone-600 bg-stone-100 border-stone-200" };
    case "CANCELLED":
      return { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200" };
    case "REFUNDED":
      return { label: "Refunded", color: "text-orange-600 bg-orange-50 border-orange-200" };
    default:
      return { label: status, color: "text-stone-600 bg-stone-100 border-stone-200" };
  }
}

export default async function BuyerOrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  // If no internal user record yet, just show empty state
  const buyerOrders = user
    ? await db.query.orders.findMany({
        where: eq(orders.buyerId, user.id),
        with: {
          store: true,
          items: true,
        },
        orderBy: [desc(orders.createdAt)],
      })
    : [];

  const activeOrders = buyerOrders.filter(
    (o) => !["COMPLETED", "CANCELLED", "REFUNDED"].includes(o.status)
  );
  const pastOrders = buyerOrders.filter((o) =>
    ["COMPLETED", "CANCELLED", "REFUNDED"].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-stone-900">My Orders</h1>
          <p className="mt-1 text-stone-500">Track and review your order history.</p>
        </div>

        {buyerOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-5">
              <ShoppingBag className="w-8 h-8 text-stone-400" />
            </div>
            <h2 className="font-display text-xl font-semibold text-stone-800 mb-2">No orders yet</h2>
            <p className="text-stone-500 text-sm mb-7 max-w-xs">
              When you place an order from a bakery, it will appear here so you can track it.
            </p>
            <Button asChild>
              <Link href="/marketplace">Browse Bakeries</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wider">
                  Active ({activeOrders.length})
                </h2>
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Orders */}
            {pastOrders.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wider">
                  Past Orders ({pastOrders.length})
                </h2>
                <div className="space-y-4">
                  {pastOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: any }) {
  const { label, color } = getStatusDetails(order.status);
  const itemCount = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
  const preview = order.items
    .slice(0, 2)
    .map((i: any) => i.productName)
    .join(", ");
  const extra = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

  return (
    <Link
      href={`/buyer/orders/${order.id}`}
      className="block bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300 transition-all group"
    >
      <div className="p-6">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="font-semibold text-stone-900 group-hover:text-primary-600 transition-colors">
              {order.store.name}
            </div>
            <div className="text-sm text-stone-500 mt-0.5">
              {order.orderNumber} · {format(new Date(order.createdAt), "MMM d, yyyy")}
            </div>
          </div>
          <Badge variant="outline" className={`text-xs shrink-0 ${color}`}>
            {label}
          </Badge>
        </div>

        {/* Items preview */}
        <p className="text-sm text-stone-600 mb-4 line-clamp-1">
          {itemCount} item{itemCount !== 1 ? "s" : ""} — {preview}{extra}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(order.scheduledDate), "MMM d")}
            </span>
            <span className="flex items-center gap-1 capitalize">
              <MapPin className="w-3.5 h-3.5" />
              {order.fulfillmentType.toLowerCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">
              ${(order.total / 100).toFixed(2)}
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Cash payment reminder banner */}
      {order.status === "CONFIRMED_CASH" && (
        <div className="bg-blue-50 border-t border-blue-100 rounded-b-2xl px-6 py-3">
          <p className="text-xs text-blue-700 font-medium">
            💳 Remember to bring ${(order.total / 100).toFixed(2)} cash on pickup day.
          </p>
        </div>
      )}
    </Link>
  );
}
