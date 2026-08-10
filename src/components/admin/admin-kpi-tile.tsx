import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_CLASSES = {
  primary: "bg-primary/10 text-primary",
  up: "bg-up/10 text-up",
  down: "bg-down/10 text-down",
  muted: "bg-surface-strong text-muted",
} as const;

/**
 * KpiTile with an icon accent chip — used on admin-only pages where the
 * extra visual weight helps operators scan a denser dashboard than the
 * store-side one.
 *
 * Optional `trend` shows a percentage delta (positive = green arrow up,
 * negative = red arrow down) so an operator can see at a glance whether
 * a metric is growing or shrinking vs. the prior period.
 *
 * Optional `subtitle` adds a secondary context line below the main value.
 */
export function AdminKpiTile({
  label,
  value,
  icon: Icon,
  accent = "primary",
  trend,
  subtitle,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENT_CLASSES;
  /** Percentage delta vs prior period. Positive = improvement (green). */
  trend?: number | null;
  /** Optional secondary line displayed below the value. */
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-hairline bg-canvas p-4 sm:p-6 min-w-0">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", ACCENT_CLASSES[accent])}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted truncate">{label}</p>
        <p className="mt-1 font-mono text-lg font-medium text-ink sm:text-2xl truncate" title={value}>
          {value}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted truncate">{subtitle}</p>
        )}
        {trend !== undefined && trend !== null && (
          <p
            className={cn(
              "mt-1 flex items-center gap-0.5 text-xs font-medium",
              trend >= 0 ? "text-up" : "text-down"
            )}
          >
            {trend >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(trend).toFixed(1)}% vs last week
          </p>
        )}
      </div>
    </div>
  );
}
