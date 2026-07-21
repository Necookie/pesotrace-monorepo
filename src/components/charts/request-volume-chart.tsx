"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type RequestVolumePoint = { label: string; count: number };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-1 font-mono text-sm font-medium text-ink">
        {payload[0].value.toLocaleString()} request{payload[0].value === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function RequestVolumeChart({ data }: { data: RequestVolumePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No extraction requests in this range yet.
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
            width={32}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-soft)" }} />
          <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
