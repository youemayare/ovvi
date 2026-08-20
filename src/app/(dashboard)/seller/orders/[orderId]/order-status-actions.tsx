"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/actions/seller-order.actions";
import { Check, Clock, PackageCheck, Send, X, AlertCircle } from "lucide-react";

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    setError(null);
    try {
      await updateOrderStatus(orderId, newStatus as any);
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  const isFinal = currentStatus === "COMPLETED" || currentStatus === "CANCELLED" || currentStatus === "REFUNDED";

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {isFinal ? (
        <p className="text-sm text-stone-500 italic">This order has been finalised and cannot be updated.</p>
      ) : (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">

          {/* Step 1: Accept new orders */}
          {(currentStatus === "PENDING_PAYMENT" || currentStatus === "CONFIRMED_CASH" || currentStatus === "CONFIRMED_PAID") && (
            <Button
              onClick={() => handleStatusChange("IN_PROGRESS")}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Accept & Start Preparing
            </Button>
          )}

          {/* Step 2: Mark ready */}
          {currentStatus === "IN_PROGRESS" && (
            <Button
              onClick={() => handleStatusChange("READY")}
              disabled={loading}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <PackageCheck className="w-4 h-4 mr-2" />
              Mark as Ready
            </Button>
          )}

          {/* Step 3: Complete */}
          {currentStatus === "READY" && (
            <Button
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={loading}
              className="bg-stone-900 text-white hover:bg-stone-800 w-full sm:w-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>
          )}

          {/* Cancel — always available before final */}
          <Button
            onClick={() => handleStatusChange("CANCELLED")}
            disabled={loading}
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Order
          </Button>
        </div>

      )}
    </div>
  );
}
