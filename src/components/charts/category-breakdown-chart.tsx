"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_CHART_COLORS } from "@/lib/chart-colors";
import { formatPeso, formatPesoCompact } from "@/lib/format";
import type { TransactionCategory } from "@/lib/database.types";

export type CategoryBreakdownPoint = {
  category: TransactionCategory;
  label: string;
  amount: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryBreakdownPoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 text-xs">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: CATEGORY_CHART_COLORS[point.category] }}
        />
        <span className="text-ink">{point.label}</span>
        <span className="ml-auto font-mono font-medium text-ink">{formatPeso(point.amount)}</span>
      </div>
    </div>
  );
}

export function CategoryBreakdownChart({ data }: { data: CategoryBreakdownPoint[] }) {
  const sorted = [...data].filter((d) => d.amount > 0).sort((a, b) => b.amount - a.amount);

  if (sorted.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No transactions in this range yet.
      </div>
    );
  }

  const height = Math.max(sorted.length * 44, 120);

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 32, left: 4, bottom: 0 }}
        >
          <XAxis type="number" hide tickFormatter={(v: number) => formatPesoCompact(v)} />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            width={72}
            tick={{ fontSize: 12, fill: "var(--color-ink)" }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-soft)" }} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {sorted.map((d) => (
              <Cell key={d.category} fill={CATEGORY_CHART_COLORS[d.category]} />
            ))}
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(v: React.ReactNode) => (typeof v === "number" ? formatPeso(v) : "")}
              style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--color-body)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
