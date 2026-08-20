"use client";

import { useState, useTransition } from "react";
import { updateReportStatus } from "@/actions/review.actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type ReportStatus = "OPEN" | "REVIEWED" | "RESOLVED";

export function ReportStatusControl({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState<ReportStatus>(currentStatus as ReportStatus);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateReportStatus(reportId, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(v) => { setStatus(v as ReportStatus); setSaved(false); }}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="OPEN">Open</SelectItem>
          <SelectItem value="REVIEWED">Reviewed</SelectItem>
          <SelectItem value="RESOLVED">Resolved</SelectItem>
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
