"use client";

import { useState } from "react";
import {
  FileText,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { formatDateTime, formatPeso, formatExtractionCost } from "@/lib/format";
import type { AdminTransactionRow, AdminUserDetailData } from "@/lib/queries/admin-types";

export function UserDetailTables({
  transactions,
  extractions,
}: {
  transactions: AdminTransactionRow[];
  extractions: AdminUserDetailData["recentExtractions"];
}) {
  const [activeTab, setActiveTab] = useState<"transactions" | "extractions">("transactions");
  const [selectedReceipt, setSelectedReceipt] = useState<AdminTransactionRow | null>(null);

  return (
    <div className="space-y-4">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-hairline pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "transactions"
              ? "bg-primary text-white"
              : "bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink"
          }`}
        >
          <FileText className="size-3.5" />
          Transactions Logged ({transactions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("extractions")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "extractions"
              ? "bg-primary text-white"
              : "bg-surface-soft text-muted hover:bg-surface-strong hover:text-ink"
          }`}
        >
          <Zap className="size-3.5" />
          AI Extractions / Tokens ({extractions.length})
        </button>
      </div>

      {/* Tab 1: Transactions */}
      {activeTab === "transactions" && (
        <div>
          {transactions.length === 0 ? (
            <AdminEmptyState
              icon={FileText}
              title="No transactions logged"
              description="This user has not logged any transactions yet."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 pl-4">Reference</TableHead>
                    <TableHead className="py-3">Counterparty</TableHead>
                    <TableHead className="py-3">Category</TableHead>
                    <TableHead className="py-3">Source</TableHead>
                    <TableHead className="py-3">Status</TableHead>
                    <TableHead className="py-3 text-right">Amount</TableHead>
                    <TableHead className="py-3 text-right">Fee</TableHead>
                    <TableHead className="py-3 pr-4 text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-surface-soft/60">
                      <TableCell className="py-3 pl-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-medium text-ink">{tx.refNumber}</span>
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
                          <p className="text-[11px] text-muted truncate max-w-[160px]">{tx.notes}</p>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-xs text-body">
                        {tx.counterpartyName || tx.counterpartyNumber || "—"}
                      </TableCell>

                      <TableCell className="py-3">
                        <CategoryBadge category={tx.category} />
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-block rounded-md bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-body capitalize">
                          {tx.sourceType}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        <StatusBadge status={tx.status} />
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Amount value={tx.amount} direction={tx.direction} />
                      </TableCell>

                      <TableCell className="py-3 text-right font-mono text-xs text-body">
                        {tx.feeComputed > 0 ? formatPeso(tx.feeComputed) : "—"}
                      </TableCell>

                      <TableCell className="py-3 pr-4 text-right text-xs text-muted">
                        {formatDateTime(tx.occurredAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: AI Extractions */}
      {activeTab === "extractions" && (
        <div>
          {extractions.length === 0 ? (
            <AdminEmptyState
              icon={Zap}
              title="No AI extractions"
              description="This user has not performed any OCR screenshot extractions yet."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-hairline bg-canvas">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 pl-4">Entry ID</TableHead>
                    <TableHead className="py-3">Source</TableHead>
                    <TableHead className="py-3 text-right">Credits Delta</TableHead>
                    <TableHead className="py-3 text-right">Gemini Cost</TableHead>
                    <TableHead className="py-3 pr-4 text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractions.map((e) => (
                    <TableRow key={e.id} className="hover:bg-surface-soft/60">
                      <TableCell className="py-3 pl-4 font-mono text-xs text-muted">
                        {e.id.slice(0, 12)}...
                      </TableCell>
                      <TableCell className="py-3 text-xs capitalize text-body">
                        {e.sourceType ?? "OCR extraction"}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs font-semibold text-down">
                        {e.creditDelta}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs text-body">
                        {formatExtractionCost(e.costUsd)}
                      </TableCell>
                      <TableCell className="py-3 pr-4 text-right text-xs text-muted">
                        {formatDateTime(e.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Dialog open={Boolean(selectedReceipt)} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-ink">
                Receipt: {selectedReceipt.refNumber}
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
              </div>

              {selectedReceipt.receiptUrl ? (
                <div className="relative flex max-h-[460px] items-center justify-center overflow-hidden rounded-xl border border-hairline bg-surface-soft p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedReceipt.receiptUrl}
                    alt={`Receipt ${selectedReceipt.refNumber}`}
                    className="max-h-[420px] w-auto rounded-lg object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-xl bg-surface-soft text-xs text-muted">
                  No image file attached.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
