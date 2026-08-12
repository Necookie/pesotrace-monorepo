"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { formatDateTime } from "@/lib/format";
import { confirmReview, getTransactionDetail } from "./actions";
import type { Database } from "@/lib/database.types";
import { CopyButton } from "@/components/shared/copy-button";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

export function TransactionDetailSheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txnId = searchParams.get("txn");
  const [row, setRow] = useState<Row | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!txnId) return;
    getTransactionDetail(txnId).then((res) => {
      if (res) {
        setRow(res.transaction);
        setImageUrl(res.signedUrl);
      } else {
        setRow(null);
        setImageUrl(null);
      }
    });
  }, [txnId]);

  // Derive rather than reset-on-close: gating on a stale row's id matching
  // the current txnId (instead of clearing row/imageUrl in the effect above)
  // also avoids briefly rendering the previous transaction's detail
  // underneath the loading state when switching between two open rows.
  const displayRow = row?.id === txnId ? row : null;
  const displayImageUrl = row?.id === txnId ? imageUrl : null;
  const loading = !!txnId && !displayRow;

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("txn");
    router.push(`/ledger?${params.toString()}`);
  }

  async function handleConfirm() {
    if (!displayRow) return;
    const result = await confirmReview(displayRow.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Marked as confirmed");
    setRow({ ...displayRow, status: "confirmed" });
    router.refresh();
  }

  return (
    <Sheet open={!!txnId} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto data-[side=right]:w-full sm:data-[side=right]:max-w-md">
        <SheetHeader>
          <SheetTitle>Transaction detail</SheetTitle>
        </SheetHeader>
        {loading && <p className="p-4 text-sm text-muted">Loading...</p>}
        {displayRow && (
          <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
            {displayImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImageUrl}
                alt="source screenshot"
                className="w-full rounded-xl border border-hairline object-contain"
              />
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Amount</span>
              <Amount value={Number(displayRow.amount)} direction={displayRow.direction} className="text-lg" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Reference</span>
              <div className="flex items-center gap-1.5 font-mono text-ink">
                <span>{displayRow.ref_number}</span>
                <CopyButton value={displayRow.ref_number} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Counterparty</span>
              <span className="text-ink">
                {displayRow.counterparty_name || displayRow.counterparty_number || "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Date</span>
              <span className="text-ink">{formatDateTime(displayRow.occurred_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Charge / Service fee</span>
              <span className="font-mono text-ink">₱{displayRow.fee_computed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Status</span>
              <StatusBadge status={displayRow.status} />
            </div>
            {displayRow.notes && (
              <div className="text-sm">
                <span className="text-muted">Comment</span>
                <p className="mt-1 rounded-xl bg-surface-soft p-3 text-ink">{displayRow.notes}</p>
              </div>
            )}
            {displayRow.status === "needs_review" && (
              <Button onClick={handleConfirm} className="w-full">
                Confirm
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
