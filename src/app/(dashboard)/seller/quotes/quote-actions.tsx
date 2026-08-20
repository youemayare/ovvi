"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendQuote, cancelQuote } from "@/actions/quote.actions";
import { Send, X, Loader2 } from "lucide-react";

export function QuoteActions({ quoteId, status }: { quoteId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"send" | "cancel" | null>(null);
  const [error, setError] = useState("");

  const handle = async (action: "send" | "cancel") => {
    setLoading(action);
    setError("");
    try {
      if (action === "send") await sendQuote(quoteId);
      else await cancelQuote(quoteId);
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  if (status === "DRAFT") {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs text-stone-500 border-stone-200"
          onClick={() => handle("cancel")}
          disabled={!!loading}
          id={`cancel-quote-${quoteId}`}
        >
          {loading === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
        </Button>
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs bg-primary-600 hover:bg-primary-700 text-white gap-1"
          onClick={() => handle("send")}
          disabled={!!loading}
          id={`send-quote-${quoteId}`}
        >
          {loading === "send" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Send className="w-3 h-3" /> Send
            </>
          )}
        </Button>
      </div>
    );
  }

  if (status === "SENT") {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => handle("cancel")}
          disabled={!!loading}
          id={`cancel-sent-quote-${quoteId}`}
        >
          {loading === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Cancel"}
        </Button>
      </div>
    );
  }

  return null;
}
