"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { groupTransactions, type GroupPeriod } from "@/lib/grouping";
import { formatDateTime } from "@/lib/format";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import { MoreVertical, Edit2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTransactionDialog } from "./edit-transaction-dialog";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

const PERIODS: { value: GroupPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function LedgerTable({ rows }: { rows: Row[] }) {
  const [period, setPeriod] = useState<GroupPeriod>("daily");
  const [editingTxn, setEditingTxn] = useState<Row | null>(null);
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
      <div className="mb-5 flex w-fit rounded-pill bg-surface-strong p-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-pill px-4 py-1.5 text-sm font-medium transition-colors",
              period === p.value ? "bg-canvas text-ink shadow-sm" : "text-body"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-soft px-4 py-2.5">
              <h3 className="text-sm font-semibold text-ink">{group.label}</h3>
              <Amount
                value={Math.abs(group.netTotal)}
                direction={group.netTotal >= 0 ? "receive" : "send"}
                className="text-sm font-semibold"
              />
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-hairline md:block">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[17%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="border-b border-hairline last:border-0">
                      <td className="px-4 py-3.5 truncate">
                        <Link href={`/ledger?txn=${row.id}`} className="text-ink hover:underline">
                          {row.counterparty_name || row.counterparty_number || "Unknown"}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted">{formatDateTime(row.occurred_at)}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted truncate" title={row.ref_number}>
                        {row.ref_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <CategoryBadge category={row.category} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Amount value={Number(row.amount)} direction={row.direction} />
                        <div className="font-mono text-xs text-muted">
                          fee {row.fee_computed > 0 ? `₱${row.fee_computed}` : "—"}
                        </div>
                      </td>
                      <td className="px-2 py-3.5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink transition-colors outline-none mx-auto">
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingTxn(row)}>
                              <Edit2 className="mr-2 size-3.5" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {group.rows.map((row) => (
                <Link
                  key={row.id}
                  href={`/ledger?txn=${row.id}`}
                  className="rounded-2xl border border-hairline p-4 block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {row.counterparty_name || row.counterparty_number || "Unknown"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{formatDateTime(row.occurred_at)}</p>
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                      <div className="text-right">
                        <Amount value={Number(row.amount)} direction={row.direction} />
                        <div className="font-mono text-xs text-muted">
                          fee {row.fee_computed > 0 ? `₱${row.fee_computed}` : "—"}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          className="flex size-7 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink transition-colors outline-none"
                        >
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEditingTxn(row);
                            }}
                          >
                            <Edit2 className="mr-2 size-3.5" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={row.category} />
                      <StatusBadge status={row.status} />
                    </div>
                    <span className="font-mono text-xs text-muted truncate max-w-[150px]">{row.ref_number}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <EditTransactionDialog
        transaction={editingTxn}
        open={!!editingTxn}
        onOpenChange={(open) => !open && setEditingTxn(null)}
      />
    </div>
  );
}
