import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PackageOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders — Seller Dashboard" };

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "text-yellow-600 bg-yellow-50 border-yellow-200",
  CONFIRMED_CASH:  "text-blue-600 bg-blue-50 border-blue-200",
  CONFIRMED_PAID:  "text-green-600 bg-green-50 border-green-200",
  IN_PROGRESS:     "text-purple-600 bg-purple-50 border-purple-200",
  READY:           "text-indigo-600 bg-indigo-50 border-indigo-200",
  COMPLETED:       "text-stone-600 bg-stone-100 border-stone-200",
  CANCELLED:       "text-red-600 bg-red-50 border-red-200",
  REFUNDED:        "text-orange-600 bg-orange-50 border-orange-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED_CASH:  "Confirmed (Cash)",
  CONFIRMED_PAID:  "Paid",
  IN_PROGRESS:     "In Preparation",
  READY:           "Ready",
  COMPLETED:       "Completed",
  CANCELLED:       "Cancelled",
  REFUNDED:        "Refunded",
};

export default async function OrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true },
  });

  if (!user || !user.store) redirect("/onboarding/store");

  const storeOrders = await db.query.orders.findMany({
    where: eq(orders.storeId, user.store.id),
    with: { buyer: true },
    orderBy: [desc(orders.createdAt)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Orders</h1>
        <p className="mt-1 text-stone-500 text-sm">Manage your active orders and history.</p>
      </div>

      {storeOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-16 text-center">
          <PackageOpen className="w-10 h-10 text-stone-300 mx-auto mb-4" />
          <p className="font-medium text-stone-700">No orders yet</p>
          <p className="text-sm text-stone-400 mt-1">Orders from customers will appear here.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: Cards (< lg) ───────────────────────────── */}
          <div className="lg:hidden space-y-3">
            {storeOrders.map((order) => {
              const buyerName = order.buyer
                ? `${order.buyer.firstName || ""} ${order.buyer.lastName || ""}`.trim() ||
                  order.buyer.email
                : "Guest";
              return (
                <Link
                  key={order.id}
                  href={`/seller/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-stone-200 shadow-sm p-4 hover:shadow-md hover:border-stone-300 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-stone-900 text-sm group-hover:text-primary-600 transition-colors">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{buyerName}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${STATUS_STYLES[order.status] ?? ""}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>
                      {format(new Date(order.createdAt), "MMM d, h:mm a")} ·{" "}
                      <span className="capitalize">{order.fulfillmentType.toLowerCase()}</span>
                    </span>
                    <span className="font-semibold text-stone-900 text-sm">
                      ${(order.total / 100).toFixed(2)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Desktop: Table (≥ lg) ─────────────────────────── */}
          <div className="hidden lg:block rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Order #</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Fulfillment</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {storeOrders.map((order) => {
                  const buyerName = order.buyer
                    ? `${order.buyer.firstName || ""} ${order.buyer.lastName || ""}`.trim() ||
                      order.buyer.email
                    : "Guest";
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-600">
                        <Link href={`/seller/orders/${order.id}`} className="hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-stone-600">
                        {format(new Date(order.createdAt), "MMM d, h:mm a")}
                      </td>
                      <td className="px-6 py-4 text-stone-700">{buyerName}</td>
                      <td className="px-6 py-4 text-stone-600 capitalize">
                        {order.fulfillmentType.toLowerCase()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_STYLES[order.status] ?? ""}`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-stone-900">
                        ${(order.total / 100).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
