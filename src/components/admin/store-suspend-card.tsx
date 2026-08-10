"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDateTime } from "@/lib/format";
import { suspendStore, unsuspendStore } from "@/app/(admin)/admin/actions";

/** Returns a human-readable "X days ago" / "X hours ago" string for a past ISO timestamp. */
function suspendedDuration(suspendedAt: string): string {
  const ms = Date.now() - new Date(suspendedAt).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function StoreSuspendCard({
  storeId,
  storeName,
  suspended,
  suspendedAt,
  suspendedReason,
}: {
  storeId: string;
  storeName: string;
  suspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSuspend(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setSaving(true);
    const result = await suspendStore({ storeId, reason });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${storeName} suspended`);
    setOpen(false);
    setReason("");
    router.refresh();
  }

  async function handleUnsuspend() {
    setSaving(true);
    const result = await unsuspendStore(storeId);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${storeName} unsuspended`);
    router.refresh();
  }

  if (suspended) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface-soft p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-down/10 text-down">
            <ShieldOff className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-ink">Store is suspended</h2>
            <p className="mt-1 text-xs text-muted">
              Extraction is blocked for this store. Everything else — data, staff, credits — is untouched.
            </p>
            {suspendedReason && <p className="mt-2 text-sm text-body">&ldquo;{suspendedReason}&rdquo;</p>}
            {suspendedAt && (
              <p className="mt-1 text-xs text-muted">
                Suspended{" "}
                <span className="font-medium text-down">{suspendedDuration(suspendedAt)}</span>
                {" · "}
                <span title={suspendedAt}>{formatDateTime(suspendedAt)}</span>
              </p>
            )}
            <Button type="button" variant="outline" className="mt-3" onClick={handleUnsuspend} disabled={saving}>
              {saving ? "Restoring..." : "Unsuspend store"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-strong text-muted">
          <ShieldCheck className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">Store access</h2>
          <p className="mt-1 text-xs text-muted">
            Suspending blocks extraction (screenshots and statement imports) without deleting anything — use it
            for abuse, non-payment, or an investigation instead of the irreversible delete below.
          </p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button type="button" variant="outline" className="mt-3" />
              }
            >
              Suspend store
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSuspend}>
                <DialogHeader>
                  <DialogTitle>Suspend {storeName}?</DialogTitle>
                  <DialogDescription>
                    Blocks screenshot and statement extraction immediately. The store keeps its data and can be
                    unsuspended at any time.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-1.5">
                  <Label className="text-xs text-muted">Reason (required, kept in the audit log)</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Payment dispute, suspected abuse, under investigation"
                    autoFocus
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={saving}>
                    {saving ? "Suspending..." : "Suspend store"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
