"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { clearTransactionHistory } from "@/app/(app)/settings/actions";

const CONFIRM_PHRASE = "DELETE";

export function ClearHistoryCard({ transactionCount }: { transactionCount: number }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);

  function resetAndClose() {
    setOpen(false);
    setConfirmText("");
  }

  async function handleClear() {
    setClearing(true);
    const result = await clearTransactionHistory(confirmText);
    setClearing(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.count > 0
        ? `Deleted ${result.count} transaction${result.count === 1 ? "" : "s"}`
        : "Transaction history cleared"
    );
    resetAndClose();
  }

  return (
    <div className="rounded-2xl border border-down/30 bg-down/5 p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-down">Danger zone</h2>
      <p className="mt-1 text-xs text-muted">
        These actions are permanent and cannot be undone. Proceed with caution.
      </p>

      <div className="mt-4 rounded-xl border border-hairline bg-canvas p-4">
        <h3 className="text-sm font-semibold text-ink">Clear transaction history</h3>
        <p className="mt-1 text-xs text-muted">
          Permanently deletes all {transactionCount > 0 ? <span className="font-mono">{transactionCount}</span> : ""}{" "}
          transactions for this store, including their uploaded receipt images. This cannot be
          undone — download a copy of your data first if you might need it later.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button type="button" variant="destructive" className="mt-3" disabled={transactionCount === 0}>
                Clear history
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear all transaction history?</DialogTitle>
              <DialogDescription>
                This permanently deletes all {transactionCount} transaction
                {transactionCount === 1 ? "" : "s"} and their receipt images for this store. There
                is no undo.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-hairline bg-surface-strong p-3">
              <p className="text-xs font-medium text-ink">Want a copy first?</p>
              <p className="mt-1 text-xs text-muted">
                Export everything before deleting it.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<a href="/api/export?format=csv" target="_blank" rel="noopener noreferrer" />}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<a href="/api/export?format=pdf" target="_blank" rel="noopener noreferrer" />}
                >
                  Download PDF
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-delete" className="text-xs font-medium text-ink">
                Type <span className="font-mono font-semibold text-down">{CONFIRM_PHRASE}</span> to
                confirm
              </label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="mt-1 font-mono"
                autoComplete="off"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={confirmText !== CONFIRM_PHRASE || clearing}
                onClick={handleClear}
              >
                {clearing ? "Deleting..." : "Permanently delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
