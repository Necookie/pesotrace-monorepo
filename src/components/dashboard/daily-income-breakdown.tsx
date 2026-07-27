import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/format";
import type { DailyIncomePoint } from "@/lib/queries/dashboard";

/**
 * The last 7 store-days as a plain income-per-day list — the daily
 * reconciliation view. Shown newest first (reversing the oldest-first series
 * the query returns) because "how did today and yesterday go" is the question,
 * and today's row is highlighted as the one still in progress.
 */
export function DailyIncomeBreakdown({ days }: { days: DailyIncomePoint[] }) {
  const rows = [...days].reverse();
  const max = Math.max(1, ...rows.map((d) => d.income));

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Daily income (last 7 days)</h2>
      <ul className="mt-4 space-y-2.5">
        {rows.map((day, i) => (
          <li key={day.day} className="flex items-center gap-3">
            <span
              className={cn(
                "w-14 shrink-0 text-xs",
                i === 0 ? "font-medium text-ink" : "text-muted"
              )}
            >
              {i === 0 ? "Today" : day.label}
            </span>
            {/* Proportional bar so relative days read at a glance. Never a
                background on the amount itself, per the brand rules. */}
            <span className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-strong">
              <span
                className="block h-full rounded-pill bg-primary"
                style={{ width: `${(day.income / max) * 100}%` }}
              />
            </span>
            <span className="w-24 shrink-0 text-right font-mono text-sm text-ink">
              {formatPeso(day.income)}
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-xs text-muted">
              {day.count} txn
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
