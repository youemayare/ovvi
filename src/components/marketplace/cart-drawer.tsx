"use client";

import { useCartStore } from "@/store/use-cart-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function CartDrawer() {
  const cart = useCartStore();
  const router = useRouter();
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="relative shrink-0">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  const totalItems = cart.getTotalItems();
  const subtotal = cart.getSubtotal();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative shrink-0">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-white overflow-hidden px-0">
        <SheetHeader className="px-6 border-b border-stone-100 pb-4">
          <SheetTitle className="font-display text-2xl text-stone-900">Your Order</SheetTitle>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="h-16 w-16 bg-stone-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-stone-400" />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 text-lg">Your cart is empty</h3>
              <p className="text-stone-500 mt-1">Looks like you haven't added anything yet.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-24 w-24 rounded-lg bg-stone-100 overflow-hidden relative shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-medium text-stone-900 line-clamp-1">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-sm text-stone-500">{item.variantName}</p>
                        )}
                      </div>
                      <span className="font-semibold text-stone-900 whitespace-nowrap text-right">
                        ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 border border-stone-200 rounded-lg p-1 bg-stone-50 text-stone-900">
                        <button 
                          onClick={() => {
                            if (item.quantity > 1) {
                              cart.updateQuantity(item.id, item.quantity - 1);
                            } else {
                              cart.removeItem(item.id);
                            }
                          }}
                          className="h-8 w-8 flex items-center justify-center hover:bg-stone-200 rounded-md transition"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-stone-200 rounded-md transition"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => cart.removeItem(item.id)}
                        className="text-stone-400 hover:text-red-500 transition p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 pt-6 space-y-4 pb-6 px-6 bg-stone-50">
              <div className="flex justify-between text-lg font-semibold text-stone-900">
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <p className="text-sm text-stone-500">
                Delivery fees and taxes calculated at checkout.
              </p>
              
              <Button 
                className="w-full text-lg h-12"
                onClick={() => {
                  if (cart.storeSlug) {
                    router.push(`/store/${cart.storeSlug}/checkout`);
                  }
                }}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
