"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { groupTransactions, type GroupPeriod } from "@/lib/grouping";
import { formatDateTime } from "@/lib/format";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

const PERIODS: { value: GroupPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function LedgerTable({ rows }: { rows: Row[] }) {
  const [period, setPeriod] = useState<GroupPeriod>("daily");
  const groups = useMemo(() => groupTransactions(rows, period), [rows, period]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-hairline py-16 text-center">
        <p className="text-sm font-medium text-ink">No transactions match these filters</p>
        <Link href="/ledger" className="text-sm text-primary">
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-sm font-medium",
              period === p.value ? "bg-surface-strong text-primary" : "text-body"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
              <Amount value={Math.abs(group.netTotal)} direction={group.netTotal >= 0 ? "receive" : "send"} />
            </div>
            <div className="overflow-hidden rounded-2xl border border-hairline">
              <table className="w-full text-sm">
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-3">
                        <Link href={`/ledger?txn=${row.id}`} className="text-ink hover:underline">
                          {row.counterparty_name || row.counterparty_number || "Unknown"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(row.occurred_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{row.ref_number}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Amount value={Number(row.amount)} direction={row.direction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
