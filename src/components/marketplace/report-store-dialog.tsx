"use client";

import { useState, useTransition } from "react";
import { reportStore } from "@/actions/review.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const REASONS = [
  "Fraudulent or scam listing",
  "Product misrepresentation",
  "Harassment or inappropriate behaviour",
  "Health and safety concern",
  "Duplicate or spam listing",
  "Other",
];

export function ReportStoreDialog({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason) {
      setError("Please select a reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await reportStore({ storeId, reason, details: details || undefined });
        setSubmitted(true);
      } catch (err: any) {
        setError(err.message || "Failed to submit report");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition-colors">
          <Flag className="w-3.5 h-3.5" />
          Report this store
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            Report {storeName}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="font-semibold text-stone-800">Report submitted</p>
            <p className="text-sm text-stone-500">
              Thank you. Our team will review this report within 24–48 hours.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-stone-500">
              Reports are reviewed by our team. Please only submit genuine concerns.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Reason</label>
              <Select onValueChange={setReason} value={reason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">
                Additional details <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <Textarea
                placeholder="Describe the issue in more detail…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                className="resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !reason}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
