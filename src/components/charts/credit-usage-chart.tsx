"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type CreditUsagePoint = { label: string; credits: number };

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
      <p className="mt-1 font-mono text-sm font-medium text-ink">{payload[0].value.toLocaleString()} credits</p>
    </div>
  );
}

/** compact drops axes/grid/tooltip for use as an inline row sparkline. */
export function CreditUsageChart({
  data,
  compact = false,
}: {
  data: CreditUsagePoint[];
  compact?: boolean;
}) {
  if (data.length === 0) {
    if (compact) return <div className="h-8 w-24 text-xs text-muted-soft">—</div>;
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No credit usage in this range yet.
      </div>
    );
  }

  const chart = (
    <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
      <defs>
        <linearGradient id="creditUsageFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.18} />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {!compact && (
        <>
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
            width={40}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-hairline)" }} />
        </>
      )}
      <Area
        type="monotone"
        dataKey="credits"
        stroke="var(--color-primary)"
        strokeWidth={compact ? 1.5 : 2}
        fill="url(#creditUsageFill)"
      />
    </AreaChart>
  );

  if (compact) {
    return (
      <div className="h-8 w-24">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={220}>
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
