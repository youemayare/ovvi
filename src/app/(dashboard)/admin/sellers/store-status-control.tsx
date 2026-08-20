"use client";

import { useState, useTransition } from "react";
import { updateStoreStatus } from "@/actions/review.actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type StoreStatus = "ACTIVE" | "SUSPENDED" | "PENDING_REVIEW";

export function StoreStatusControl({
  storeId,
  currentStatus,
}: {
  storeId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState<StoreStatus>(currentStatus as StoreStatus);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateStoreStatus(storeId, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(v) => { setStatus(v as StoreStatus); setSaved(false); }}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs"
        disabled={isPending || status === currentStatus}
        onClick={handleSave}
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? "Saved!" : "Save"}
      </Button>
    </div>
  );
}
