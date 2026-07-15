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

type Row = Database["public"]["Tables"]["transactions"]["Row"];

export function TransactionDetailSheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txnId = searchParams.get("txn");
  const [row, setRow] = useState<Row | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!txnId) {
      setRow(null);
      setImageUrl(null);
      return;
    }
    setLoading(true);
    getTransactionDetail(txnId).then((res) => {
      if (res) {
        setRow(res.transaction);
        setImageUrl(res.signedUrl);
      } else {
        setRow(null);
        setImageUrl(null);
      }
      setLoading(false);
    });
  }, [txnId]);

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("txn");
    router.push(`/ledger?${params.toString()}`);
  }

  async function handleConfirm() {
    if (!row) return;
    const result = await confirmReview(row.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Marked as confirmed");
    setRow({ ...row, status: "confirmed" });
    router.refresh();
  }

  return (
    <Sheet open={!!txnId} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction detail</SheetTitle>
        </SheetHeader>
        {loading && <p className="p-4 text-sm text-muted">Loading...</p>}
        {row && (
          <div className="space-y-4 p-4">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="source screenshot"
                className="w-full rounded-xl border border-hairline object-contain"
              />
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Amount</span>
              <Amount value={Number(row.amount)} direction={row.direction} className="text-lg" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Reference</span>
              <span className="font-mono text-ink">{row.ref_number}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Counterparty</span>
              <span className="text-ink">
                {row.counterparty_name || row.counterparty_number || "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Date</span>
              <span className="text-ink">{formatDateTime(row.occurred_at)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Charge / Service fee</span>
              <span className="font-mono text-ink">₱{row.fee_computed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Status</span>
              <StatusBadge status={row.status} />
            </div>
            {row.notes && (
              <div className="text-sm">
                <span className="text-muted">Comment</span>
                <p className="mt-1 rounded-xl bg-surface-soft p-3 text-ink">{row.notes}</p>
              </div>
            )}
            {row.status === "needs_review" && (
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
