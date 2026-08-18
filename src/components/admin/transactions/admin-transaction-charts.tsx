"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPeso, formatPesoCompact } from "@/lib/format";
import { CATEGORY_CHART_COLORS } from "@/lib/chart-colors";
import type { AdminTransactionStats } from "@/lib/queries/admin-types";
import type { TransactionCategory } from "@/lib/database.types";

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  cash_in: "Cash in",
  cash_out: "Cash out",
  load: "Load",
  bills: "Bills",
  other: "Other",
};

export function AdminTransactionCharts({ stats }: { stats: AdminTransactionStats }) {
  const categoryData = (Object.keys(stats.byCategory) as TransactionCategory[])
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      volume: stats.byCategory[cat]?.volume ?? 0,
      count: stats.byCategory[cat]?.count ?? 0,
    }))
    .filter((d) => d.volume > 0 || d.count > 0)
    .sort((a, b) => b.volume - a.volume);

  const trendData = stats.volumeTrend;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 1. Volume Trend Chart (2 columns on lg) */}
      <div className="lg:col-span-2 rounded-2xl border border-hairline bg-canvas p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ink">Volume & Activity Over Time</h3>
            <p className="text-xs text-muted">Daily transaction volume and transaction count</p>
          </div>
          <span className="font-mono text-xs font-semibold text-primary">
            {trendData.length} active day{trendData.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-4">
          {trendData.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-muted">
              No transaction history in this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} barGap={2} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  width={56}
                  tickFormatter={(v: number) => formatPesoCompact(v)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as { volume: number; count: number; fee: number };
                    return (
                      <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-lg">
                        <p className="text-xs font-semibold text-ink">{label}</p>
                        <p className="mt-1 font-mono text-sm font-medium text-primary">
                          {formatPeso(item.volume)}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-3 text-xs text-muted">
                          <span>{item.count.toLocaleString()} transactions</span>
                          <span className="font-mono text-ink">Fee: {formatPeso(item.fee)}</span>
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: "var(--color-surface-soft)" }}
                />
                <Bar dataKey="volume" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Category Distribution Breakdown */}
      <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-5">
        <h3 className="text-sm font-medium text-ink">Volume by Category</h3>
        <p className="text-xs text-muted">Breakdown across transaction types</p>

        <div className="mt-4">
          {categoryData.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-muted">
              No transactions categorized yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 4, right: 30, left: 4, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  width={68}
                  tick={{ fontSize: 11, fill: "var(--color-ink)" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as { category: TransactionCategory; label: string; volume: number; count: number };
                    return (
                      <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-lg">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_CHART_COLORS[item.category] }}
                          />
                          {item.label}
                        </div>
                        <p className="mt-1 font-mono text-sm text-ink">{formatPeso(item.volume)}</p>
                        <p className="text-xs text-muted">{item.count.toLocaleString()} transactions</p>
                      </div>
                    );
                  }}
                  cursor={{ fill: "var(--color-surface-soft)" }}
                />
                <Bar dataKey="volume" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {categoryData.map((d) => (
                    <Cell key={d.category} fill={CATEGORY_CHART_COLORS[d.category] || "var(--color-primary)"} />
                  ))}
                  <LabelList
                    dataKey="volume"
                    position="right"
                    formatter={(v: any) => (typeof v === "number" ? formatPesoCompact(v) : "")}
                    style={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--color-body)" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
