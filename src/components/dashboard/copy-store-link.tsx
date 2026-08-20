"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyStoreLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Read-only URL input */}
      <div className="flex-1 min-w-0 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-600 font-mono truncate">
        {url}
      </div>

      {/* Copy button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0 gap-1.5"
        id="copy-store-link-btn"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-600" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copy
          </>
        )}
      </Button>

      {/* Open in new tab */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        asChild
        className="shrink-0"
        id="open-store-link-btn"
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Button>
    </div>
  );
}
