"use client";

import { useMemo, useState } from "react";
import { groupTransactions, type GroupPeriod } from "@/lib/grouping";
import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function ReportBuilder({ rows }: { rows: Row[] }) {
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [grouping, setGrouping] = useState<GroupPeriod>("weekly");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const d = r.occurred_at.slice(0, 10);
        return d >= from && d <= to;
      }),
    [rows, from, to]
  );

  const groups = useMemo(() => groupTransactions(filtered, grouping), [filtered, grouping]);

  const downloadUrl = `/api/export?format=${format}&from=${from}&to=${to}`;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4 rounded-2xl border border-hairline p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Build a report</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Group by</Label>
          <select
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as GroupPeriod)}
            className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Format</Label>
          <div className="flex w-fit rounded-pill bg-surface-strong p-1">
            {(["csv", "pdf"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  "rounded-pill px-4 py-1.5 text-sm font-medium uppercase transition-colors",
                  format === f ? "bg-canvas text-ink shadow-sm" : "text-body"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <Button type="button" onClick={() => window.open(downloadUrl, "_blank")}>
          Download {format.toUpperCase()}
        </Button>
      </div>

      <div className="rounded-2xl border border-hairline p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Preview</h2>
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
          {groups.length === 0 && (
            <p className="text-sm text-muted">No transactions in this range.</p>
          )}
          {groups.map((g) => (
            <div key={g.key} className="flex items-center justify-between text-sm min-w-0 gap-3">
              <span className="text-body truncate flex-1">{g.label}</span>
              <span className="font-mono text-ink shrink-0">{formatPeso(Math.abs(g.netTotal))}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
