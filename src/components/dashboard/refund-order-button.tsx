"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { refundOrderAsSeller } from "@/actions/cancel-refund.actions";
import { RotateCcw, Loader2, AlertTriangle } from "lucide-react";

export function RefundOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  const handleRefund = async () => {
    setStep("loading");
    setError("");
    try {
      await refundOrderAsSeller(orderId);
      setStep("done");
      setTimeout(() => router.refresh(), 1500);
    } catch (e: any) {
      setError(e.message || "Refund failed. Please try again.");
      setStep("confirm");
    }
  };

  if (step === "done") {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 font-medium">
        ✓ Refund issued — the buyer will receive their money within 5–10 business days.
      </p>
    );
  }

  if (step === "confirm") {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 font-medium">
            Are you sure? This will issue a full refund to the buyer's card. This cannot be undone.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStep("idle")}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleRefund}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            id="confirm-refund-btn"
          >
            Yes, Issue Refund
          </Button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <Button size="sm" disabled className="text-orange-600 border-orange-200">
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        Processing refund…
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => setStep("confirm")}
      className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
      id="issue-refund-btn"
    >
      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
      Issue Refund
    </Button>
  );
}
