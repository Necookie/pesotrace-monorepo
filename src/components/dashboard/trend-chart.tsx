import { formatPeso } from "@/lib/format";

type Point = { label: string; send: number; receive: number };

export function TrendChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-hairline text-sm text-muted">
        No transactions in the last 30 days yet.
      </div>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.send, d.receive]), 1);
  const width = 640;
  const height = 180;
  const barWidth = width / data.length;

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-6">
      <div className="mb-4 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-body">
          <span className="size-2 rounded-full bg-down" /> Send
        </span>
        <span className="flex items-center gap-1.5 text-body">
          <span className="size-2 rounded-full bg-up" /> Receive
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const sendH = (d.send / max) * (height - 20);
          const receiveH = (d.receive / max) * (height - 20);
          const x = i * barWidth;
          return (
            <g key={d.label}>
              <rect
                x={x + barWidth * 0.15}
                y={height - sendH}
                width={barWidth * 0.3}
                height={sendH}
                className="fill-down"
              />
              <rect
                x={x + barWidth * 0.55}
                y={height - receiveH}
                width={barWidth * 0.3}
                height={receiveH}
                className="fill-up"
              />
              <title>
                {d.label}: send {formatPeso(d.send)}, receive {formatPeso(d.receive)}
              </title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
