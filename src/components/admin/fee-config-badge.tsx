import { cn } from "@/lib/utils";
import type { FeeConfigSummary } from "@/lib/fees";

/**
 * Compact read-out of a store's fee setup for the admin overview.
 *
 * The three states an operator cares about while scanning are distinct on
 * sight: a broken formula (needs fixing now), a store still on the shipped
 * default (probably never configured), and everything else.
 */
export function FeeConfigBadge({
  summary,
  className,
}: {
  summary: FeeConfigSummary;
  className?: string;
}) {
  const broken = Boolean(summary.formulaError);

  return (
    <div className={cn("min-w-0", className)}>
      <span
        className={cn(
          "inline-block rounded-pill px-2 py-0.5 text-[11px] font-medium",
          broken
            ? "bg-down/10 text-down"
            : summary.mode === "formula"
              ? "bg-primary/10 text-primary"
              : summary.isDefault
                ? "bg-surface-strong text-muted"
                : "bg-surface-strong text-ink"
        )}
      >
        {broken ? "Formula broken" : summary.isDefault ? "Default" : summary.label}
      </span>
      <p className="mt-1 truncate font-mono text-[11px] text-muted" title={summary.detail}>
        {summary.detail}
      </p>
    </div>
  );
}
