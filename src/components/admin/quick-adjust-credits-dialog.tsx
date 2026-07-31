"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { adjustStoreCredits } from "@/app/(admin)/admin/actions";

/**
 * Grant/deduct credits for a store directly from the overview row — the
 * common "top up a trial" or "correct a balance" action didn't need a full
 * navigation to the store detail page just to reach AdjustCreditsForm there.
 */
export function QuickAdjustCreditsDialog({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setDelta("");
    setNote("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedDelta = Number(delta);
    if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
      toast.error("Enter a nonzero amount (negative to remove credits)");
      return;
    }

    setSaving(true);
    const result = await adjustStoreCredits({ storeId, delta: parsedDelta, note });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Credits updated");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Adjust credits for ${storeName}`}
            className="flex size-11 items-center justify-center rounded-pill text-muted hover:bg-primary/10 hover:text-primary"
          />
        }
      >
        <Wallet className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adjust credits — {storeName}</DialogTitle>
            <DialogDescription>
              Positive to grant/top up, negative to remove. A note is required for the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted">Amount</Label>
              <Input
                type="number"
                step="1"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted">Note</Label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason (e.g. approved trial, manual top-up)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Apply adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
