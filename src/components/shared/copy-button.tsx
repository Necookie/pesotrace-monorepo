"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  title?: string;
}

export function CopyButton({ value, className, title = "Copy to clipboard" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1 text-muted hover:text-ink hover:bg-surface-strong transition-colors",
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-up transition-transform scale-110" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
