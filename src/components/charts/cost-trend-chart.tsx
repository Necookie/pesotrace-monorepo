"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatExtractionCost } from "@/lib/format";
import type { PeriodStat } from "@/lib/cost-report";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: PeriodStat }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const stat = payload[0].payload;

  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-1 font-mono text-sm font-medium text-ink">{formatExtractionCost(stat.costUsd)}</p>
      <p className="mt-0.5 text-xs text-muted">
        {stat.requests.toLocaleString()} request{stat.requests === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Real (Gemini) cost trend for a daily/weekly/monthly PeriodStat series. */
export function CostTrendChart({ data }: { data: PeriodStat[] }) {
  if (data.every((d) => d.costUsd === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No cost in this range yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-hairline)" />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: "var(--color-hairline)" }}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--color-muted)" }}
            width={64}
            tickFormatter={(v: number) => formatExtractionCost(v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-soft)" }} />
          <Bar dataKey="costUsd" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
