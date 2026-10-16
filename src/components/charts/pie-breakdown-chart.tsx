"use client";

import { useState } from "react";
import { DonutChart, DonutChartCenter, DonutChartLegend, DonutChartPlot } from "./donut-chart";
import { formatPeso } from "@/lib/format";

export type PieSlice = { key: string; label: string; value: number; color: string };
export type PieValueFormat = "peso" | "count";

export function PieBreakdownChart({ data, centerLabel, format = "peso" }: {
  data: PieSlice[];
  centerLabel?: string;
  format?: PieValueFormat;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const segments = data.filter((slice) => slice.value > 0).map((slice) => ({
    id: slice.key, name: slice.label, value: slice.value, color: slice.color,
  }));
  if (segments.length === 0) return <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">No transactions in this range yet.</div>;

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <DonutChart segments={segments} label={centerLabel ?? "Transaction breakdown"}
        formatValue={format === "count" ? (value) => value.toLocaleString() : formatPeso}
        selectedId={selected} onSelect={(id) => setSelected((current) => current === id ? null : id)}>
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <DonutChartPlot><DonutChartCenter totalLabel={centerLabel ?? "Total"} /></DonutChartPlot>
          <DonutChartLegend />
        </div>
      </DonutChart>
    </div>
  );
}
