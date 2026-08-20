"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuote, sendQuote } from "@/actions/quote.actions";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export function QuoteForm() {
  const [isPending, setIsPending] = useState(false);
  const [quoteLink, setQuoteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !priceDollars) {
      toast.error("Title and Price are required.");
      return;
    }

    try {
      setIsPending(true);
      const priceCents = Math.round(parseFloat(priceDollars) * 100);
      
      const result = await createQuote({
        title,
        description,
        price: priceCents,
        scheduledDate,
        buyerName,
        buyerPhone,
      });

      if (result.success && result.quote) {
        // Immediately transition to SENT so the 48h expiry clock starts
        await sendQuote(result.quote.id).catch(console.error);
        toast.success("Quote link generated — expires in 48 hours.");
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        setQuoteLink(`${origin}/quote/${result.quote.checkoutToken}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate quote.");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopy = () => {
    if (quoteLink) {
      navigator.clipboard.writeText(quoteLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (quoteLink) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">Payment Link Ready!</h2>
        <p className="text-stone-500 mb-8">
          Send this link to your customer on WhatsApp. They can review the details and pay securely using Stripe.
        </p>
        
        <div className="flex items-center gap-2 max-w-md mx-auto mb-8">
          <Input value={quoteLink} readOnly className="bg-stone-50" />
          <Button onClick={handleCopy} variant="outline" className="shrink-0 w-24">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => {
            setQuoteLink(null);
            setTitle("");
            setDescription("");
            setPriceDollars("");
            setScheduledDate("");
            setBuyerName("");
            setBuyerPhone("");
          }}>
            Create Another
          </Button>
          <Button asChild>
            <a href={`https://wa.me/${buyerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${buyerName},\n\nHere is the payment link for your custom order: ${title}.\n\nPay securely here: ${quoteLink}\n\nThank you!`)}`} target="_blank" rel="noreferrer">
              Send via WhatsApp
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="buyerName">Customer Name (Optional)</Label>
            <Input 
              id="buyerName" 
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="E.g., Sarah Smith"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="buyerPhone">WhatsApp Number (Optional)</Label>
            <Input 
              id="buyerPhone" 
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="For 1-click sharing"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="title">Order Title <span className="text-red-500">*</span></Label>
          <Input 
            id="title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., 2-Tier Dinosaur Birthday Cake"
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="description">Details / Description</Label>
          <Textarea 
            id="description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Vanilla sponge, strawberry filling, pickup at 2 PM..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="price">Total Price ($) <span className="text-red-500">*</span></Label>
            <Input 
              id="price" 
              type="number"
              step="0.01"
              min="1"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="150.00"
              required
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="scheduledDate">Date Needed</Label>
            <Input 
              id="scheduledDate" 
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-100 flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? "Generating..." : "Generate Payment Link"}
        </Button>
      </div>
    </form>
  );
}
