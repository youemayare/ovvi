import { db } from "@/db";
import { orders, users, reviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, MessageCircle, Store, Star } from "lucide-react";
import { ReviewForm } from "@/components/marketplace/review-form";
import { CancelOrderButton } from "@/components/marketplace/cancel-order-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Ovvi",
};

function getStatusDetails(status: string): { label: string; color: string; description: string } {
  switch (status) {
    case "PENDING_PAYMENT":
      return {
        label: "Pending Payment",
        color: "text-yellow-700 bg-yellow-50 border-yellow-200",
        description: "Your order has been placed and is awaiting payment confirmation.",
      };
    case "CONFIRMED_CASH":
      return {
        label: "Confirmed — Cash on pickup",
        color: "text-blue-700 bg-blue-50 border-blue-200",
        description: "The bakery has confirmed your order. Please bring cash when you pick up.",
      };
    case "CONFIRMED_PAID":
      return {
        label: "Payment Confirmed",
        color: "text-green-700 bg-green-50 border-green-200",
        description: "Your payment has been confirmed and your order is queued.",
      };
    case "IN_PROGRESS":
      return {
        label: "Being Prepared",
        color: "text-purple-700 bg-purple-50 border-purple-200",
        description: "The baker is currently working on your order. 🎂",
      };
    case "READY":
      return {
        label: "Ready!",
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
        description: "Your order is ready and waiting for you. Head over to pick it up!",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        color: "text-stone-600 bg-stone-100 border-stone-200",
        description: "This order has been completed. We hope you enjoyed it!",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "text-red-600 bg-red-50 border-red-200",
        description: "This order has been cancelled.",
      };
    case "REFUNDED":
      return {
        label: "Refunded",
        color: "text-orange-600 bg-orange-50 border-orange-200",
        description: "A refund has been issued for this order.",
      };
    default:
      return { label: status, color: "text-stone-600 bg-stone-100", description: "" };
  }
}

// Timeline steps in order
const STATUS_STEPS = [
  { key: "PENDING_PAYMENT", label: "Order Placed" },
  { key: "CONFIRMED_CASH|CONFIRMED_PAID", label: "Confirmed" },
  { key: "IN_PROGRESS", label: "Being Prepared" },
  { key: "READY", label: "Ready" },
  { key: "COMPLETED", label: "Completed" },
];

function getStepIndex(status: string): number {
  if (status === "CANCELLED" || status === "REFUNDED") return -1;
  if (status === "PENDING_PAYMENT") return 0;
  if (status === "CONFIRMED_CASH" || status === "CONFIRMED_PAID") return 1;
  if (status === "IN_PROGRESS") return 2;
  if (status === "READY") return 3;
  if (status === "COMPLETED") return 4;
  return 0;
}

export default async function BuyerOrderDetailPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  const params = await props.params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) redirect("/buyer/orders");

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, params.orderId), eq(orders.buyerId, user.id)),
    with: {
      store: true,
      items: true,
    },
  });

  if (!order) notFound();

  // Check if review already exists
  const existingReview = await db.query.reviews.findFirst({
    where: eq(reviews.orderId, order.id),
  });

  const { label, color, description } = getStatusDetails(order.status);
  const currentStep = getStepIndex(order.status);
  const isCancellable = ["PENDING_PAYMENT", "CONFIRMED_CASH", "CONFIRMED_PAID"].includes(order.status);
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";
  const isCompleted = order.status === "COMPLETED";


  // Build WhatsApp link to contact the baker
  const storePhone = (order.store as any).whatsappNumber || (order.store as any).phone;
  const waMessage = encodeURIComponent(
    `Hi! I'm following up on my order ${order.orderNumber} placed on Ovvi.`
  );
  const waLink = storePhone
    ? `https://wa.me/${storePhone.replace(/\D/g, "")}?text=${waMessage}`
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Back link */}
        <Link
          href="/buyer/orders"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Orders
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">
              {order.store.name}
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Order {order.orderNumber} · {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge variant="outline" className={`shrink-0 ${color}`}>{label}</Badge>
        </div>

        {/* Status description */}
        {description && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm px-6 py-4">
            <p className="text-stone-600 text-sm">{description}</p>
            {order.status === "CONFIRMED_CASH" && (
              <p className="mt-2 font-semibold text-blue-700">
                Cash due: ${(order.total / 100).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Progress tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-start justify-between relative">
              {/* connector line — offset to center of dots */}
              <div className="absolute top-3.5 sm:top-4 left-3.5 sm:left-4 right-3.5 sm:right-4 h-0.5 bg-stone-200" />
              <div
                className="absolute top-3.5 sm:top-4 left-3.5 sm:left-4 h-0.5 bg-primary-500 transition-all duration-700"
                style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * (100 - (100 / STATUS_STEPS.length))}%` }}
              />
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        done
                          ? "bg-primary-500 border-primary-500 text-white"
                          : "bg-white border-stone-300 text-stone-400"
                      } ${active ? "ring-2 ring-primary-200 ring-offset-1" : ""}`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-[10px] sm:text-xs text-center leading-tight px-0.5 ${done ? "text-stone-700 font-medium" : "text-stone-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Order Items */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 font-semibold text-stone-900">
            Your Items
          </div>
          <div className="divide-y divide-stone-100">
            {order.items.map((item: any) => (
              <div key={item.id} className="px-6 py-4 flex justify-between items-start">
                <div>
                  <p className="font-medium text-stone-900">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-sm text-stone-500 mt-0.5">{item.variantName}</p>
                  )}
                  <p className="text-sm text-stone-400 mt-0.5">
                    Qty {item.quantity} × ${(item.unitPrice / 100).toFixed(2)}
                  </p>
                </div>
                <p className="font-medium text-stone-900 ml-4">
                  ${(item.totalPrice / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 space-y-2">
            <div className="flex justify-between text-sm text-stone-500">
              <span>Subtotal</span>
              <span>${(order.subtotal / 100).toFixed(2)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-stone-500">
                <span>Delivery Fee</span>
                <span>${(order.deliveryFee / 100).toFixed(2)}</span>
              </div>
            )}
            {order.platformFee > 0 && (
              <div className="flex justify-between text-sm text-stone-500">
                <span>Service Fee</span>
                <span>${(order.platformFee / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-stone-900 text-lg pt-2 border-t border-stone-200">
              <span>Total</span>
              <span>${(order.total / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Fulfillment & Notes */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-stone-900">Pickup / Delivery Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-stone-600">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <div>
                <span className="font-medium text-stone-800">
                  {format(new Date(order.scheduledDate), "EEEE, MMMM d, yyyy")}
                </span>
                {order.scheduledTimeSlot && (
                  <span className="text-stone-500"> ({order.scheduledTimeSlot})</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-stone-600 capitalize">
              <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
              <span>
                <span className="font-medium text-stone-800">{order.fulfillmentType.toLowerCase()}</span>
                {order.fulfillmentType === "DELIVERY" && order.deliveryAddress && (
                  <span className="text-stone-500"> — {order.deliveryAddress}</span>
                )}
              </span>
            </div>
            {order.buyerNotes && (
              <div className="pt-3 border-t border-stone-100">
                <p className="text-stone-500 text-xs mb-1 uppercase tracking-wide">Your Notes</p>
                <p className="italic text-stone-600">"{order.buyerNotes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation */}
        {isCancellable && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-stone-900">Need to cancel?</h2>
            <p className="text-sm text-stone-500">
              You can cancel before the baker starts preparation.
              {order.paymentMethod === "STRIPE"
                ? " A full refund will be issued automatically."
                : " No payment was taken, so no refund is needed."}
            </p>
            <CancelOrderButton orderId={order.id} paymentMethod={order.paymentMethod} />
          </div>
        )}

        {/* Review Section — only for completed orders */}
        {isCompleted && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
            <h2 className="font-semibold text-stone-900 mb-4">
              {existingReview ? "Your Review" : "Leave a Review"}
            </h2>
            {existingReview ? (
              <div className="space-y-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      className={`w-6 h-6 ${
                        s <= existingReview.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-stone-200"
                      }`}
                    />
                  ))}
                </div>
                {existingReview.comment && (
                  <p className="text-stone-600 italic text-sm">"{existingReview.comment}"</p>
                )}
                <p className="text-xs text-stone-400">
                  Reviewed on {format(new Date(existingReview.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            ) : (
              <ReviewForm orderId={order.id} />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {waLink && (
            <Button asChild variant="outline" className="flex-1">
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Baker on WhatsApp
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/store/${order.store.slug}`}>
              <Store className="w-4 h-4 mr-2" />
              Visit {order.store.name}
            </Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/marketplace">Browse More Bakeries</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
