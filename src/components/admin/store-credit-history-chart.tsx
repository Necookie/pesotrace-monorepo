import type { CreditBalancePoint } from "@/lib/queries/admin";

/**
 * Compact credit-balance sparkline for the store detail page.
 * Renders an SVG path tracing the daily balance over the past 30 days
 * so an operator can see at a glance whether the store has been burning
 * through credits steadily or has an idle balance that needs attention.
 */
export function StoreCreditBalanceSparkline({
  data,
  width = 320,
  height = 60,
}: {
  data: CreditBalancePoint[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const maxBalance = Math.max(...data.map((d) => d.balance), 1);
  const minBalance = Math.min(...data.map((d) => d.balance), 0);
  const range = maxBalance - minBalance || 1;

  const padding = { top: 4, bottom: 4, left: 0, right: 0 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const xStep = plotWidth / (data.length - 1);
  const toX = (i: number) => padding.left + i * xStep;
  const toY = (v: number) => padding.top + plotHeight - ((v - minBalance) / range) * plotHeight;

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.balance).toFixed(1)}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${toX(data.length - 1).toFixed(1)} ${(padding.top + plotHeight).toFixed(1)}` +
    ` L ${toX(0).toFixed(1)} ${(padding.top + plotHeight).toFixed(1)} Z`;

  const lastBalance = data[data.length - 1].balance;
  const isDown = lastBalance <= (data[0]?.balance ?? 0) * 0.9;

  const lineColor = isDown ? "var(--color-down)" : "var(--color-up)";
  const fillId = `sparkline-fill-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="rounded-xl border border-hairline bg-surface-soft p-3">
      <p className="mb-1.5 text-xs font-medium text-muted">Credit balance — last 30 days</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        aria-label="Credit balance history sparkline"
        role="img"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${fillId})`} />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-mono text-muted">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
