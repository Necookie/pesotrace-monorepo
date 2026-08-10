import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StoreStatus = "suspended" | "out_of_credits" | "spike" | "active";

/**
 * Single source of truth for the store status pills displayed in the
 * stores overview table and anywhere else a store's state needs a
 * visual label. Keeps the badge styles consistent across the table
 * and any future card/detail surfaces.
 */
export function StoreStatusBadge({
  status,
  className,
}: {
  status: StoreStatus;
  className?: string;
}) {
  if (status === "suspended") {
    return (
      <span
        className={cn(
          "ml-2 inline-block rounded-pill bg-down/10 px-2 py-0.5 text-[11px] font-medium text-down",
          className
        )}
      >
        Suspended
      </span>
    );
  }

  if (status === "out_of_credits") {
    return (
      <span
        className={cn(
          "ml-2 inline-block rounded-pill bg-surface-strong px-2 py-0.5 text-[11px] font-medium text-down",
          className
        )}
      >
        Out of credits
      </span>
    );
  }

  if (status === "spike") {
    return (
      <span
        title="Usage spike: today's requests are ≥3× this store's 7-day trailing average. Could be a great sales day or a shared/abused API key — check the ledger."
        className={cn(
          "ml-2 inline-flex items-center gap-0.5 rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary cursor-help",
          className
        )}
      >
        <TrendingUp className="size-3" />
        Spike
      </span>
    );
  }

  return null;
}
