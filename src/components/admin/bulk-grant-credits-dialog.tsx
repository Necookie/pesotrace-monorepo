"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
} from "@/components/ui/dialog";
import { bulkAdjustCredits } from "@/app/(admin)/admin/actions";

export function BulkGrantCreditsDialog({
  open,
  onOpenChange,
  storeIds,
  storeNames,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeIds: string[];
  storeNames: string[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDelta("");
      setNote("");
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedDelta = Number(delta);
    if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
      toast.error("Enter a nonzero amount (negative to remove credits)");
      return;
    }

    setSaving(true);
    const result = await bulkAdjustCredits({ storeIds, delta: parsedDelta, note });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Applied to ${result.succeededCount} store${result.succeededCount === 1 ? "" : "s"}`);
    handleOpenChange(false);
    onDone();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Adjust credits for {storeIds.length} store{storeIds.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              Positive to grant, negative to remove. Applied to every selected store with the same amount and
              note.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-32 overflow-y-auto rounded-lg border border-hairline bg-surface-soft p-2">
            <ul className="space-y-0.5 text-xs text-body">
              {storeNames.map((name) => (
                <li key={name} className="truncate">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted">Amount per store</Label>
                <div className="flex gap-1">
                  {[25, 50, 100, 250].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDelta(String(val))}
                      className="rounded px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted hover:bg-surface-strong hover:text-ink"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                step="1"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g. 50 or -20"
                className="font-mono"
                autoFocus
              />
              {Number(delta) !== 0 && !isNaN(Number(delta)) && (
                <p className="text-[11px] text-muted">
                  Total platform impact:{" "}
                  <strong className="font-mono text-ink">
                    {Number(delta) > 0 ? "+" : ""}
                    {(Number(delta) * storeIds.length).toLocaleString()} credits
                  </strong>{" "}
                  across {storeIds.length} stores
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted">Note</Label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason (e.g. promo, bulk trial top-up)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Applying..." : `Apply to ${storeIds.length}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
