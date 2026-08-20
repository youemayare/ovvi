"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrderAsBuyer } from "@/actions/cancel-refund.actions";
import { XCircle, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const CANCEL_REASONS = [
  "I changed my mind",
  "I ordered the wrong item",
  "I found a better option",
  "The date no longer works for me",
  "Other",
];

interface CancelOrderButtonProps {
  orderId: string;
  paymentMethod: string;
}

export function CancelOrderButton({ orderId, paymentMethod }: CancelOrderButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const effectiveReason = reason === "Other" ? customReason : reason;

  const handleCancel = async () => {
    if (!effectiveReason.trim()) {
      setError("Please select or enter a reason.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await cancelOrderAsBuyer(orderId, effectiveReason);
      setDone(true);
      setTimeout(() => {
        router.refresh();
        setOpen(false);
        setDone(false);
      }, 1800);
    } catch (e: any) {
      setError(e.message || "Failed to cancel the order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-500 hover:text-red-600 underline underline-offset-2 transition-colors"
        id="cancel-order-btn"
      >
        Cancel this order
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800">Cancel this order?</p>
          <p className="text-sm text-red-600 mt-0.5">
            {paymentMethod === "STRIPE"
              ? "A full refund will be issued to your original payment method within 5–10 business days."
              : "This is a cash order — no payment was taken, so no refund is needed."}
          </p>
        </div>
      </div>

      {/* Reason picker */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-red-800">Reason for cancellation</p>
        <div className="space-y-1.5">
          {CANCEL_REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="cancel-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-red-500"
              />
              <span className="text-sm text-red-700 group-hover:text-red-900 transition-colors">
                {r}
              </span>
            </label>
          ))}
        </div>
        {reason === "Other" && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Please briefly describe your reason…"
            rows={2}
            className="w-full mt-2 text-sm px-3 py-2 rounded-lg border border-red-200 bg-white text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-white border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {done && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-medium">
          ✓ Order cancelled{paymentMethod === "STRIPE" ? " — refund initiated" : ""}.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setOpen(false); setReason(""); setError(""); }}
          disabled={loading || done}
          className="flex-1"
        >
          Keep Order
        </Button>
        <Button
          size="sm"
          onClick={handleCancel}
          disabled={loading || done || !effectiveReason.trim()}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          id="confirm-cancel-order-btn"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Cancelling…</>
          ) : (
            <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Confirm Cancellation</>
          )}
        </Button>
      </div>
    </div>
  );
}
