"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyBadge({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label || text}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-surface px-2.5 py-1 text-xs font-mono text-muted transition-colors hover:border-ink/20 hover:text-ink",
        copied && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
        className
      )}
    >
      {copied ? (
        <Check className="size-3 text-emerald-600" />
      ) : (
        <Copy className="size-3 text-muted" />
      )}
      <span>{label ? `${label}: ${text}` : text}</span>
    </button>
  );
}
