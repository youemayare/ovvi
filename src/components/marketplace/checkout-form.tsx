"use client";

import { useCartStore } from "@/store/use-cart-store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/actions/order.actions";
import { toast } from "sonner";
import Image from "next/image";

interface CheckoutFormProps {
  store: {
    id: string;
    slug: string;
    name: string;
    cashEnabled: boolean;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryFee: number;
    pickupInstructions: string | null;
  };
}

export function CheckoutForm({ store }: CheckoutFormProps) {
  const cart = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Form State
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">(
    store.pickupEnabled ? "PICKUP" : "DELIVERY"
  );
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE" | "CASH">("STRIPE");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (cart.items.length === 0 || cart.storeId !== store.id) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold text-stone-900">Your cart is empty</h2>
        <p className="text-stone-500 mt-2">Add some items from {store.name} to continue.</p>
        <Button className="mt-6" onClick={() => router.push(`/store/${store.slug}`)}>
          Back to Menu
        </Button>
      </div>
    );
  }

  const subtotal = cart.getSubtotal();
  const deliveryFee = fulfillmentType === "DELIVERY" ? store.deliveryFee : 0;
  const platformFee = Math.round(subtotal * 0.10);
  const total = subtotal + deliveryFee + platformFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDate) {
      toast.error("Please select a date for your order.");
      return;
    }
    if (fulfillmentType === "DELIVERY" && !deliveryAddress) {
      toast.error("Please enter a delivery address.");
      return;
    }

    try {
      setIsPending(true);
      const result = await createOrder({
        storeId: store.id,
        items: cart.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          productName: i.productName,
          variantName: i.variantName,
          unitPrice: i.unitPrice,
          quantity: i.quantity
        })),
        paymentMethod,
        fulfillmentType,
        scheduledDate,
        scheduledTimeSlot,
        deliveryAddress,
        buyerNotes
      });

      if (result.success && result.url) {
        if (paymentMethod === "CASH") {
           cart.clearCart();
        }
        window.location.href = result.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
      {/* ── Order Summary: top on mobile, sidebar on desktop ── */}
      <div className="lg:col-span-5 lg:order-last">
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-stone-200 lg:sticky lg:top-24">
          <h2 className="text-lg sm:text-xl font-display font-bold text-stone-900 mb-5">Order Summary</h2>

          <div className="space-y-3 mb-5 max-h-[35vh] overflow-y-auto pr-1">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-14 w-14 bg-stone-100 rounded-lg overflow-hidden relative shrink-0">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-900 text-sm truncate">{item.productName}</h4>
                  {item.variantName && (
                    <p className="text-xs text-stone-500 mt-0.5">{item.variantName}</p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-stone-500">Qty: {item.quantity}</span>
                    <span className="font-medium text-stone-900 text-sm">
                      ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            {fulfillmentType === "DELIVERY" && deliveryFee > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee</span>
                <span>${(deliveryFee / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Service Fee</span>
              <span>${(platformFee / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-stone-900 pt-3 border-t border-stone-100">
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Desktop CTA — hidden on mobile (we use sticky bottom bar instead) */}
          <Button
            type="submit"
            form="checkout-form"
            className="hidden lg:flex w-full mt-5 h-12 text-base"
            disabled={isPending}
          >
            {isPending ? "Processing..." : paymentMethod === "STRIPE" ? "Continue to Payment" : "Place Order"}
          </Button>
        </div>
      </div>

      {/* ── Form ─────────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-6 lg:order-first">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-display font-bold text-stone-900 mb-6">How would you like to get your order?</h2>
            <RadioGroup 
              value={fulfillmentType} 
              onValueChange={(val: "PICKUP" | "DELIVERY") => setFulfillmentType(val)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {store.pickupEnabled && (
                <Label
                  className={`flex flex-col border-2 rounded-xl p-4 cursor-pointer transition ${
                    fulfillmentType === "PICKUP" ? "border-primary-500 bg-primary-50" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="PICKUP" />
                    <span className="font-semibold text-stone-900">Pickup</span>
                  </div>
                  {store.pickupInstructions && (
                    <p className="mt-2 text-sm text-stone-500 ml-7">{store.pickupInstructions}</p>
                  )}
                </Label>
              )}
              {store.deliveryEnabled && (
                <Label
                  className={`flex flex-col border-2 rounded-xl p-4 cursor-pointer transition ${
                    fulfillmentType === "DELIVERY" ? "border-primary-500 bg-primary-50" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="DELIVERY" />
                      <span className="font-semibold text-stone-900">Delivery</span>
                    </div>
                    {store.deliveryFee > 0 && (
                      <span className="text-sm font-medium text-stone-600">+${(store.deliveryFee / 100).toFixed(2)}</span>
                    )}
                  </div>
                </Label>
              )}
            </RadioGroup>

            {fulfillmentType === "DELIVERY" && (
              <div className="mt-6 space-y-3 animate-fade-in">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea 
                  id="address" 
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street address, building, apartment, city..."
                  required
                />
              </div>
            )}
          </section>

          {/* Date & Time Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-display font-bold text-stone-900 mb-6">When do you need it?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  min={new Date().toISOString().split("T")[0]}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="time">Time (Optional)</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={scheduledTimeSlot}
                  onChange={(e) => setScheduledTimeSlot(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Label htmlFor="notes">Notes for the Baker</Label>
              <Textarea 
                id="notes" 
                value={buyerNotes}
                onChange={(e) => setBuyerNotes(e.target.value)}
                placeholder="Any special requests or allergies?"
              />
            </div>
          </section>

          {/* Payment Method Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <h2 className="text-xl font-display font-bold text-stone-900 mb-6">Payment Method</h2>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(val: "STRIPE" | "CASH") => setPaymentMethod(val)}
              className="space-y-4"
            >
              <Label
                className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === "STRIPE" ? "border-primary-500 bg-primary-50" : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <RadioGroupItem value="STRIPE" />
                <div>
                  <span className="font-semibold text-stone-900 block">Pay with Card (Stripe)</span>
                  <span className="text-sm text-stone-500">Secure online payment</span>
                </div>
              </Label>
              
              {store.cashEnabled && (
                <Label
                  className={`flex items-center gap-3 border-2 rounded-xl p-4 cursor-pointer transition ${
                    paymentMethod === "CASH" ? "border-primary-500 bg-primary-50" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <RadioGroupItem value="CASH" />
                  <div>
                    <span className="font-semibold text-stone-900 block">Cash on {fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}</span>
                    <span className="text-sm text-stone-500">Pay directly to the baker</span>
                  </div>
                </Label>
              )}
            </RadioGroup>
          </section>
        </form>

        {/* ── Mobile-only sticky CTA ─────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <p className="text-xs text-stone-500">Total</p>
              <p className="font-bold text-stone-900">${(total / 100).toFixed(2)}</p>
            </div>
            <Button
              type="submit"
              form="checkout-form"
              className="flex-1 h-11 text-base"
              disabled={isPending}
            >
              {isPending ? "Processing..." : paymentMethod === "STRIPE" ? "Continue to Payment →" : "Place Order →"}
            </Button>
          </div>
        </div>

        {/* Bottom padding so sticky bar doesn't cover last form element on mobile */}
        <div className="h-24 lg:hidden" />
      </div>
    </div>
  );
}
