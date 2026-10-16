"use client";

import { ApexAreaChart } from "./apex-area-chart";
import { formatPeso, formatPesoCompact } from "@/lib/format";

export type FeeTrendPoint = { label: string; fee: number };

export function FeeTrendChart({ data }: { data: FeeTrendPoint[] }) {
  if (data.length === 0) return <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">No transactions in this range yet.</div>;

  return <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6" aria-label="Fee trend">
    <ApexAreaChart series={[{ name: "Fees", data: data.map((point) => point.fee) }]}
      labels={data.map((point) => point.label)} colors={["#0052ff"]}
      formatValue={formatPesoCompact} formatTooltip={(value) => formatPeso(value)} />
    <span className="sr-only">{data.map((point) => `${point.label}: ${formatPeso(point.fee)}`).join(", ")}</span>
  </div>;
}
