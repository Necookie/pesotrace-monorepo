import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/lib/database.types";

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill px-2.5 py-1 text-xs font-medium",
        status === "confirmed" ? "bg-surface-strong text-up" : "bg-surface-strong text-down"
      )}
    >
      {status === "confirmed" ? "Confirmed" : "Needs review"}
    </span>
  );
}
