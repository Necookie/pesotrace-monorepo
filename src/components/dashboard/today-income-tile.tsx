import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/format";

/**
 * The hero figure of the dashboard: income earned so far today (Manila).
 * Larger and set apart from the 30-day KPI row because it's the number an
 * owner opens the app to check — the running total against the cash drawer.
 */
export function TodayIncomeTile({
  income,
  deltaPct,
}: {
  income: number;
  deltaPct: number | null;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-5 sm:p-6">
      <p className="text-sm font-medium text-muted">Today&apos;s income</p>
      <p className="mt-1 font-mono text-3xl font-semibold text-ink sm:text-4xl">
        {formatPeso(income)}
      </p>
      <p
        className={cn(
          "mt-1.5 flex items-center gap-0.5 text-xs font-medium",
          deltaPct === null && "text-muted",
          deltaPct !== null && deltaPct >= 0 && "text-up",
          deltaPct !== null && deltaPct < 0 && "text-down"
        )}
      >
        {deltaPct === null ? (
          "vs. yesterday — no income yesterday"
        ) : (
          <>
            {deltaPct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(deltaPct).toFixed(1)}% vs. yesterday
          </>
        )}
      </p>
    </div>
  );
}
