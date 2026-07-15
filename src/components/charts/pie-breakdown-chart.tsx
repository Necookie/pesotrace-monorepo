"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPeso } from "@/lib/format";

export type PieSlice = { key: string; label: string; value: number; color: string };

function ChartTooltip({
  active,
  payload,
  valueFormatter,
}: {
  active?: boolean;
  payload?: { payload: PieSlice }[];
  valueFormatter: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0].payload;

  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
        <span className="text-ink">{slice.label}</span>
        <span className="ml-auto font-mono font-medium text-ink">{valueFormatter(slice.value)}</span>
      </div>
    </div>
  );
}

export function PieBreakdownChart({
  data,
  centerLabel,
  valueFormatter = formatPeso,
}: {
  data: PieSlice[];
  centerLabel?: string;
  valueFormatter?: (v: number) => string;
}) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  if (slices.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No transactions in this range yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="var(--color-canvas)"
              strokeWidth={2}
            >
              {slices.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-semibold text-ink">{valueFormatter(total)}</span>
          {centerLabel && <span className="text-xs text-muted">{centerLabel}</span>}
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {slices.map((d) => (
          <li key={d.key} className="flex items-center gap-1.5 text-xs text-body">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
