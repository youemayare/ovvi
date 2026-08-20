"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/use-cart-store";

export function ClearCartOnMount() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // We clear the cart immediately on mount because if they made it to the success page, 
    // the order is placed (or pending payment via Stripe session).
    clearCart();
  }, [clearCart]);

  return null;
}
