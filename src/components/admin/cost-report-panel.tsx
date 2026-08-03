"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatExtractionCost } from "@/lib/format";
import { CostTrendChart } from "@/components/charts/lazy";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import type { CostReport, PeriodStat, PeriodTotals } from "@/lib/cost-report";

const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

function deltaPct(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return ((current - prior) / prior) * 100;
}

function StatCard({
  label,
  current,
  comparisonLabel,
  pct,
}: {
  label: string;
  current: PeriodTotals;
  comparisonLabel: string;
  pct: number | null;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 font-mono text-lg font-semibold text-ink">{formatExtractionCost(current.costUsd)}</p>
      <p className="mt-1 font-mono text-xs text-muted">
        {current.requests.toLocaleString()} request{current.requests === 1 ? "" : "s"}
      </p>
      {pct === null ? (
        <p className="mt-1 text-xs text-muted">No {comparisonLabel} data</p>
      ) : (
        <p className={cn("mt-1 flex items-center gap-0.5 text-xs font-medium", pct >= 0 ? "text-up" : "text-down")}>
          {pct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(pct).toFixed(1)}% vs {comparisonLabel}
        </p>
      )}
    </div>
  );
}

const PERIOD_COPY: Record<
  Period,
  { current: keyof CostReport; prior: keyof CostReport; currentLabel: string; priorLabel: string }
> = {
  daily: { current: "today", prior: "yesterday", currentLabel: "Today", priorLabel: "yesterday" },
  weekly: { current: "thisWeek", prior: "lastWeek", currentLabel: "This week", priorLabel: "last week" },
  monthly: { current: "thisMonth", prior: "lastMonth", currentLabel: "This month", priorLabel: "last month" },
};

/**
 * Daily/weekly/monthly cost & usage report — a period switcher over one
 * trend chart plus a per-period breakdown table, backed by buildCostReport.
 * Used both platform-wide (admin overview) and per-store (store detail).
 */
export function CostReportPanel({ report, title = "Cost & usage" }: { report: CostReport; title?: string }) {
  const [period, setPeriod] = useState<Period>("daily");

  const series = report[period] as PeriodStat[];
  const copy = PERIOD_COPY[period];
  const current = report[copy.current] as PeriodTotals;
  const prior = report[copy.prior] as PeriodTotals;
  const pct = deltaPct(current.costUsd, prior.costUsd);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <div className="flex w-fit rounded-pill bg-surface-strong p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-pill px-4 py-1.5 text-sm font-medium transition-colors",
                period === p.value ? "bg-canvas text-ink shadow-sm" : "text-body"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label={copy.currentLabel} current={current} comparisonLabel={copy.priorLabel} pct={pct} />
        <StatCard
          label={copy.priorLabel[0].toUpperCase() + copy.priorLabel.slice(1)}
          current={prior}
          comparisonLabel="the period before"
          pct={null}
        />
      </div>

      <div className="mt-4">
        <CostTrendChart data={series} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 pl-4">{period === "daily" ? "Day" : period === "weekly" ? "Week" : "Month"}</TableHead>
              <TableHead className="py-3 text-right">Requests</TableHead>
              <TableHead className="py-3 text-right">Credits</TableHead>
              <TableHead className="py-3 pr-4 text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...series].reverse().map((stat) => (
              <TableRow key={stat.key}>
                <TableCell className="py-2.5 pl-4 text-sm text-ink">{stat.label}</TableCell>
                <TableCell className="py-2.5 text-right font-mono text-sm text-body">
                  {stat.requests.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 text-right font-mono text-sm text-body">
                  {stat.credits.toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 pr-4 text-right font-mono text-sm text-ink">
                  {stat.costUsd > 0 ? formatExtractionCost(stat.costUsd) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
