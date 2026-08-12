"use client";

import { useMemo, useState } from "react";
import { groupTransactions, type GroupPeriod } from "@/lib/grouping";
import { formatPeso } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TransactionCategory } from "@/lib/database.types";
import type { ReportRow } from "@/lib/queries/transactions";
import { CATEGORY_LABELS } from "@/lib/schemas/transaction";
import { SendReceiveChart, CategoryBreakdownChart } from "@/components/charts/lazy";

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function ReportBuilder({ rows }: { rows: ReportRow[] }) {
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [grouping, setGrouping] = useState<GroupPeriod>("weekly");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  const setPreset = (preset: "today" | "7d" | "30d" | "month" | "ytd") => {
    const today = isoDaysAgo(0);
    const now = new Date();
    if (preset === "today") {
      setFrom(today);
      setTo(today);
    } else if (preset === "7d") {
      setFrom(isoDaysAgo(7));
      setTo(today);
    } else if (preset === "30d") {
      setFrom(isoDaysAgo(30));
      setTo(today);
    } else if (preset === "month") {
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      setFrom(monthStart);
      setTo(today);
    } else if (preset === "ytd") {
      const yearStart = `${now.getFullYear()}-01-01`;
      setFrom(yearStart);
      setTo(today);
    }
  };

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const d = r.occurred_at.slice(0, 10);
        return d >= from && d <= to;
      }),
    [rows, from, to]
  );

  const summary = useMemo(() => {
    let volume = 0;
    let fees = 0;
    let send = 0;
    let receive = 0;
    for (const r of filtered) {
      const amt = Number(r.amount) || 0;
      volume += amt;
      fees += Number(r.fee_computed) || 0;
      if (r.direction === "send") send += amt;
      else receive += amt;
    }
    return {
      count: filtered.length,
      volume,
      fees,
      send,
      receive,
    };
  }, [filtered]);

  const groups = useMemo(() => groupTransactions(filtered, grouping), [filtered, grouping]);

  const trend = useMemo(
    () =>
      [...groups]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((g) => ({ label: g.label, send: g.sendTotal, receive: g.receiveTotal })),
    [groups]
  );

  const categoryTotals = useMemo(() => {
    const totals = new Map<TransactionCategory, number>();
    for (const r of filtered) {
      totals.set(r.category, (totals.get(r.category) ?? 0) + Number(r.amount));
    }
    return (Object.keys(CATEGORY_LABELS) as TransactionCategory[]).map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      amount: totals.get(category) ?? 0,
    }));
  }, [filtered]);

  const downloadUrl = `/api/export?format=${format}&from=${from}&to=${to}`;

  return (
    <div className="space-y-6">
      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-hairline bg-canvas p-4">
          <p className="text-xs text-muted">Filtered Volume</p>
          <p className="mt-1 font-mono text-xl font-semibold text-ink">{formatPeso(summary.volume)}</p>
          <p className="mt-0.5 text-xs text-body">{summary.count} transactions</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-canvas p-4">
          <p className="text-xs text-muted">Fees Earned</p>
          <p className="mt-1 font-mono text-xl font-semibold text-primary">{formatPeso(summary.fees)}</p>
          <p className="mt-0.5 text-xs text-body">Estimated revenue</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-canvas p-4">
          <p className="text-xs text-muted">Cash Out (Send)</p>
          <p className="mt-1 font-mono text-xl font-semibold text-down">{formatPeso(summary.send)}</p>
        </div>
        <div className="rounded-2xl border border-hairline bg-canvas p-4">
          <p className="text-xs text-muted">Cash In (Receive)</p>
          <p className="mt-1 font-mono text-xl font-semibold text-up">{formatPeso(summary.receive)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-hairline p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-ink">Build a report</h2>

          <div className="space-y-1.5">
            <Label>Date presets</Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Today", value: "today" },
                { label: "7 Days", value: "7d" },
                { label: "30 Days", value: "30d" },
                { label: "This Month", value: "month" },
                { label: "Year to Date", value: "ytd" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPreset(p.value as "today" | "7d" | "30d" | "month" | "ytd")}
                  className="rounded-pill border border-hairline bg-surface-soft px-3 py-1 text-xs font-medium text-body hover:border-primary hover:text-ink transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

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
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm md:h-8"
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
                    "min-h-11 rounded-pill px-4 text-sm font-medium uppercase transition-colors md:min-h-0 md:py-1.5",
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Send vs. Receive</h2>
          <SendReceiveChart data={trend} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">By category</h2>
          <CategoryBreakdownChart data={categoryTotals} />
        </div>
      </div>
    </div>
  );
}
