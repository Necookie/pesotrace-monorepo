"use client";

import { ApexAreaChart } from "./apex-area-chart";
import { formatExtractionCost } from "@/lib/format";
import type { PeriodStat } from "@/lib/cost-report";

export function CostTrendChart({ data }: { data: PeriodStat[] }) {
  if (data.every((point) => point.costUsd === 0)) return <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">No cost in this range yet.</div>;

  return <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6" aria-label="Extraction cost trend">
    <ApexAreaChart series={[{ name: "Cost", data: data.map((point) => point.costUsd) }]}
      labels={data.map((point) => point.label)} colors={["#0052ff"]} formatValue={formatExtractionCost}
      formatTooltip={(value, index) => `${formatExtractionCost(value)} · ${data[index]?.requests.toLocaleString() ?? 0} requests`} />
  </div>;
}
