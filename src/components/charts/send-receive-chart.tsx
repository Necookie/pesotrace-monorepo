"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPeso, formatPesoCompact } from "@/lib/format";

export type SendReceivePoint = { label: string; send: number; receive: number };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const send = payload.find((p) => p.dataKey === "send")?.value ?? 0;
  const receive = payload.find((p) => p.dataKey === "receive")?.value ?? 0;

  return (
    <div className="rounded-xl border border-hairline bg-canvas px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <p className="text-xs font-medium text-ink">{label}</p>
      <div className="mt-1.5 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-0.5 w-3 shrink-0 rounded-full bg-down" />
          <span className="text-muted">Send</span>
          <span className="ml-auto font-mono font-medium text-ink">{formatPeso(send)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-0.5 w-3 shrink-0 rounded-full bg-up" />
          <span className="text-muted">Receive</span>
          <span className="ml-auto font-mono font-medium text-ink">{formatPeso(receive)}</span>
        </div>
      </div>
    </div>
  );
}

export function SendReceiveChart({ data }: { data: SendReceivePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No transactions in this range yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-body">
          <span className="size-2 rounded-full bg-down" /> Send
        </span>
        <span className="flex items-center gap-1.5 text-body">
          <span className="size-2 rounded-full bg-up" /> Receive
        </span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barGap={2} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-hairline)" strokeDasharray="0" />
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
            tickFormatter={(v: number) => formatPesoCompact(v)}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-soft)" }} />
          <Bar dataKey="send" fill="var(--color-down)" radius={[4, 4, 0, 0]} maxBarSize={20} />
          <Bar dataKey="receive" fill="var(--color-up)" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
