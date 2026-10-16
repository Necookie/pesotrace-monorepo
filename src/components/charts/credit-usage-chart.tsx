"use client";

import { ApexAreaChart } from "./apex-area-chart";

export type CreditUsagePoint = { label: string; credits: number };

export function CreditUsageChart({ data, compact = false }: { data: CreditUsagePoint[]; compact?: boolean }) {
  if (data.length === 0) return compact ? <div className="h-8 w-24 text-xs text-muted-soft">—</div> : <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">No credit usage in this range yet.</div>;

  const chart = <ApexAreaChart series={[{ name: "Credits", data: data.map((point) => point.credits) }]}
    labels={data.map((point) => point.label)} colors={["#0052ff"]}
    formatValue={(value) => Math.round(value).toLocaleString()} formatTooltip={(value) => `${Math.round(value).toLocaleString()} credits`}
    compact={compact} height={compact ? 32 : 220} />;

  return compact ? <div className="h-8 w-24 overflow-hidden" aria-label="Credit usage trend">{chart}</div> : <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">{chart}</div>;
}
