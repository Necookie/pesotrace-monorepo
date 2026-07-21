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
import { deleteStore } from "@/app/(admin)/admin/actions";

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

  function resetAndClose() {
    setOpen(false);
    setConfirmText("");
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
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={storeName}
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
            disabled={confirmText !== storeName || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Permanently delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
