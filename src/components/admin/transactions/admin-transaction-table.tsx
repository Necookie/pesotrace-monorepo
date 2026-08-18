"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { HighlightedText } from "@/components/admin/highlighted-text";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { formatDateTime, formatPeso } from "@/lib/format";
import type { AdminTransactionRow } from "@/lib/queries/admin-types";

export function AdminTransactionTable({
  transactions,
  totalCount,
  page,
  pageSize,
  totalPages,
  query,
}: {
  transactions: AdminTransactionRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedReceipt, setSelectedReceipt] = useState<AdminTransactionRow | null>(null);

  const sortBy = searchParams.get("sortBy") ?? "occurred_at";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/admin/transactions?${params.toString()}`);
  }

  function handleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (sortBy === key) {
      params.set("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", key);
      params.set("sortDir", "desc");
    }
    router.push(`/admin/transactions?${params.toString()}`);
  }

  if (transactions.length === 0) {
    return (
      <div className="mt-6">
        <AdminEmptyState
          icon={FileText}
          title="No transactions found"
          description={
            query
              ? `No transactions matched "${query}" with the current filters. Try changing your search or date range.`
              : "No transactions have been recorded in this date range."
          }
        />
      </div>
    );
  }

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Table header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-soft px-4 py-2.5">
        <p className="text-xs sm:text-sm text-body">
          Showing <span className="font-semibold text-ink">{startRecord}–{endRecord}</span> of{" "}
          <span className="font-semibold text-ink">{totalCount.toLocaleString()}</span> transaction
          {totalCount === 1 ? "" : "s"}
        </p>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            <span className="px-2 text-xs text-muted">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="h-8 gap-1 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 pl-4">Store</TableHead>
                <TableHead className="py-3">Reference / Notes</TableHead>
                <TableHead className="py-3">Counterparty</TableHead>
                <TableHead className="py-3">Category</TableHead>
                <TableHead className="py-3">Source</TableHead>
                <TableHead className="py-3">Status</TableHead>
                <TableHead
                  className="cursor-pointer py-3 text-right hover:text-ink"
                  onClick={() => handleSort("amount")}
                >
                  Amount {sortBy === "amount" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead
                  className="cursor-pointer py-3 text-right hover:text-ink"
                  onClick={() => handleSort("fee_computed")}
                >
                  Fee {sortBy === "fee_computed" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
                <TableHead
                  className="cursor-pointer py-3 pr-4 text-right hover:text-ink"
                  onClick={() => handleSort("occurred_at")}
                >
                  When {sortBy === "occurred_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-surface-soft/60">
                  {/* Store Link */}
                  <TableCell className="py-3 pl-4 font-medium">
                    <Link
                      href={`/admin/stores/${tx.storeId}`}
                      className="text-ink hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <span className="truncate max-w-[140px]">{tx.storeName}</span>
                      <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted" />
                    </Link>
                  </TableCell>

                  {/* Ref & Receipt & Notes */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-ink font-medium">
                        <HighlightedText text={tx.refNumber} query={query ?? ""} />
                      </span>
                      {tx.receiptUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(tx)}
                          title="View receipt image"
                          className="rounded p-0.5 text-muted hover:bg-surface-strong hover:text-primary transition-colors"
                        >
                          <ImageIcon className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {tx.notes && (
                      <p className="mt-0.5 text-[11px] text-muted truncate max-w-[180px]">
                        <HighlightedText text={tx.notes} query={query ?? ""} />
                      </p>
                    )}
                    {tx.createdBy && (
                      <Link
                        href={`/admin/users/${tx.createdBy}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors"
                      >
                        <User className="size-2.5" />
                        {tx.creatorName ?? tx.createdBy.slice(0, 8)}
                      </Link>
                    )}
                  </TableCell>

                  {/* Counterparty */}
                  <TableCell className="py-3 text-xs text-body">
                    {tx.counterpartyName ? (
                      <div className="font-medium text-ink">
                        <HighlightedText text={tx.counterpartyName} query={query ?? ""} />
                      </div>
                    ) : null}
                    {tx.counterpartyNumber ? (
                      <div className="font-mono text-[11px] text-muted">
                        <HighlightedText text={tx.counterpartyNumber} query={query ?? ""} />
                      </div>
                    ) : !tx.counterpartyName ? (
                      <span className="text-muted">—</span>
                    ) : null}
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-3">
                    <CategoryBadge category={tx.category} />
                  </TableCell>

                  {/* Source */}
                  <TableCell className="py-3">
                    <span className="inline-block rounded-md bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-body capitalize">
                      {tx.sourceType}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    <StatusBadge status={tx.status} />
                  </TableCell>

                  {/* Amount */}
                  <TableCell className="py-3 text-right">
                    <Amount value={Number(tx.amount)} direction={tx.direction} />
                  </TableCell>

                  {/* Fee */}
                  <TableCell className="py-3 text-right font-mono text-xs text-body">
                    {tx.feeComputed > 0 ? formatPeso(tx.feeComputed) : "—"}
                  </TableCell>

                  {/* When */}
                  <TableCell className="py-3 pr-4 text-right text-xs text-muted">
                    {formatDateTime(tx.occurredAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs text-muted">
            Page {page} of {totalPages} ({totalCount.toLocaleString()} items)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {selectedReceipt && (
        <Dialog open={Boolean(selectedReceipt)} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-ink flex items-center justify-between">
                <span>Receipt: {selectedReceipt.refNumber}</span>
                <span className="text-xs font-normal text-muted">{selectedReceipt.storeName}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-soft p-3 text-xs">
                <div>
                  <span className="text-muted">Amount: </span>
                  <span className="font-semibold font-mono text-ink">
                    {formatPeso(selectedReceipt.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Fee: </span>
                  <span className="font-semibold font-mono text-ink">
                    {formatPeso(selectedReceipt.feeComputed)}
                  </span>
                </div>
                <div>
                  <span className="text-muted">Category: </span>
                  <span className="font-medium capitalize text-ink">{selectedReceipt.category}</span>
                </div>
                <div>
                  <span className="text-muted">Date: </span>
                  <span className="text-ink">{formatDateTime(selectedReceipt.occurredAt)}</span>
                </div>
              </div>

              {selectedReceipt.receiptUrl ? (
                <div className="relative flex max-h-[500px] items-center justify-center overflow-hidden rounded-xl border border-hairline bg-surface-soft p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedReceipt.receiptUrl}
                    alt={`Receipt ${selectedReceipt.refNumber}`}
                    className="max-h-[460px] w-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl bg-surface-soft text-sm text-muted">
                  No receipt image available.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
