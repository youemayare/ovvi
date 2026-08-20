import { db } from "@/db";
import { orders, users, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { OrderStatusActions } from "./order-status-actions";
import { RefundOrderButton } from "@/components/dashboard/refund-order-button";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING_PAYMENT":
      return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">Pending Payment</Badge>;
    case "CONFIRMED_CASH":
      return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">Confirmed (Cash)</Badge>;
    case "CONFIRMED_PAID":
      return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Paid</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">In Preparation</Badge>;
    case "READY":
      return <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-200">Ready</Badge>;
    case "COMPLETED":
      return <Badge variant="outline" className="text-stone-600 bg-stone-100 border-stone-200">Completed</Badge>;
    case "CANCELLED":
      return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Cancelled</Badge>;
    case "REFUNDED":
      return <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function OrderDetailsPage(props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { store: true }
  });

  if (!user || !user.store) redirect("/onboarding/store");

  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.id, params.orderId),
      eq(orders.storeId, user.store.id)
    ),
    with: {
      buyer: true,
      items: true,
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link href="/seller/orders">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
              Order {order.orderNumber}
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">
              {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <div className="ml-12 sm:ml-auto">
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Items & Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-stone-100 font-medium text-stone-900">
              Order Items
            </div>
            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex justify-between">
                  <div>
                    <div className="font-medium text-stone-900">{item.productName}</div>
                    {item.variantName && (
                      <div className="text-sm text-stone-500 mt-1">{item.variantName}</div>
                    )}
                    <div className="text-sm text-stone-500 mt-1">
                      Qty: {item.quantity} × ${(item.unitPrice / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium text-stone-900">
                    ${(item.totalPrice / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-stone-50 p-6 space-y-3 border-t border-stone-100">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Subtotal</span>
                <span>${(order.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600">
                <span>Delivery Fee</span>
                <span>${(order.deliveryFee / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600">
                <span>Platform Fee</span>
                <span>${(order.platformFee / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg text-stone-900 pt-3 border-t border-stone-200">
                <span>Total</span>
                <span>${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
            <h3 className="font-medium text-stone-900">Manage Order</h3>
            <OrderStatusActions orderId={order.id} currentStatus={order.status} />

            {/* Refund button — shown for card-paid orders that are cancelled or still open */}
            {order.paymentMethod === "STRIPE" &&
              !(["REFUNDED", "PENDING_PAYMENT"].includes(order.status)) && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-2">Card payment options</p>
                <RefundOrderButton orderId={order.id} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h3 className="font-medium text-stone-900 mb-4">Customer</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-stone-500 mb-1">Name</div>
                <div className="font-medium text-stone-900">
                  {order.buyer ? `${order.buyer.firstName || ""} ${order.buyer.lastName || ""}`.trim() || "Guest User" : "Guest"}
                </div>
              </div>
              {order.buyer?.email && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Mail className="w-4 h-4 text-stone-400" />
                  <a href={`mailto:${order.buyer.email}`} className="hover:underline">
                    {order.buyer.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h3 className="font-medium text-stone-900 mb-4">Fulfillment details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-stone-500 mb-1">Method</div>
                <div className="font-medium text-stone-900 capitalize">
                  {order.fulfillmentType.toLowerCase()}
                </div>
              </div>
              
              <div>
                <div className="text-stone-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Scheduled Date
                </div>
                <div className="font-medium text-stone-900">
                  {format(new Date(order.scheduledDate), "MMM d, yyyy")}
                  {order.scheduledTimeSlot && ` (${order.scheduledTimeSlot})`}
                </div>
              </div>

              {order.fulfillmentType === "DELIVERY" && order.deliveryAddress && (
                <div>
                  <div className="text-stone-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </div>
                  <div className="font-medium text-stone-900 whitespace-pre-line">
                    {order.deliveryAddress}
                  </div>
                </div>
              )}

              {order.buyerNotes && (
                <div className="pt-4 border-t border-stone-100">
                  <div className="text-stone-500 mb-1">Customer Notes</div>
                  <div className="text-stone-700 italic">"{order.buyerNotes}"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
