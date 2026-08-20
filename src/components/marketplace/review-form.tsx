"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/actions/review.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-stone-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

export function ReviewForm({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await submitReview({ orderId, rating, comment: comment || undefined });
        setSubmitted(true);
      } catch (err: any) {
        setError(err.message || "Failed to submit review");
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <p className="font-semibold text-stone-800">Thanks for your review!</p>
        <p className="text-sm text-stone-500">Your feedback helps other buyers discover great bakers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">Your Rating</label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-sm font-medium text-amber-600">{LABELS[rating]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">
          Comments <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <Textarea
          placeholder="How was the quality, presentation, and communication? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          className="resize-none"
        />
        <p className="text-xs text-stone-400 text-right">{comment.length}/1000</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white"
      >
        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Submit Review
      </Button>
    </div>
  );
}
