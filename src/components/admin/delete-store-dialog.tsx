"use client";

import { useState, useEffect } from "react";
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
import { deleteStore } from "@/app/(admin)/admin/actions";

const SAFETY_DELAY_SECONDS = 3;

export function DeleteStoreDialog({
  storeId,
  storeName,
  trigger,
  onDeleted,
}: {
  storeId: string;
  storeName: string;
  trigger: React.ReactElement;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [countdown, setCountdown] = useState(SAFETY_DELAY_SECONDS);

  // Reset countdown whenever the dialog opens and the store name is typed correctly.
  const nameMatches = confirmText === storeName;

  useEffect(() => {
    if (!nameMatches || !open) {
      setCountdown(SAFETY_DELAY_SECONDS);
      return;
    }
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [nameMatches, open, countdown]);

  function resetAndClose() {
    setOpen(false);
    setConfirmText("");
    setCountdown(SAFETY_DELAY_SECONDS);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteStore({ storeId, confirmName: confirmText });
    setDeleting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${storeName} deleted`);
    resetAndClose();
    onDeleted();
  }

  const deleteReady = nameMatches && countdown <= 0 && !deleting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {storeName}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the store and everything tied to it — transactions, receipt
            images, credit history, staff profiles. There is no undo.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label htmlFor="confirm-delete-store" className="text-xs font-medium text-ink">
            Type <span className="font-mono font-semibold text-down">{storeName}</span> to confirm
          </label>
          <Input
            id="confirm-delete-store"
            value={confirmText}
            onChange={(e) => { setConfirmText(e.target.value); setCountdown(SAFETY_DELAY_SECONDS); }}
            placeholder={storeName}
            className="mt-1 font-mono"
            autoComplete="off"
          />
          {nameMatches && countdown > 0 && (
            <p className="mt-1.5 text-xs text-muted">
              Delete button unlocks in{" "}
              <span className="font-mono font-medium text-down">{countdown}s</span>…
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!deleteReady}
            onClick={handleDelete}
          >
            {deleting
              ? "Deleting..."
              : nameMatches && countdown > 0
              ? `Wait ${countdown}s…`
              : "Permanently delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
