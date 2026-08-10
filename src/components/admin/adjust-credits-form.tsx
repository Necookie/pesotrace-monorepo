"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { adjustStoreCredits } from "@/app/(admin)/admin/actions";

const QUICK_AMOUNTS = [10, 50, 100, -10] as const;

export function AdjustCreditsForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

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

    setDelta("");
    setNote("");
    toast.success("Credits updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Adjust credits</h2>
      <p className="mt-1.5 text-xs text-muted">
        Positive to grant/top up, negative to remove. A note is required for the audit trail.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setDelta(String(amount))}
            className={cn(
              "rounded-pill border px-3 py-1 text-xs font-mono font-medium transition-colors",
              delta === String(amount)
                ? amount > 0
                  ? "border-up/50 bg-up/10 text-up"
                  : "border-down/50 bg-down/10 text-down"
                : "border-hairline text-muted hover:border-ink/30 hover:text-ink"
            )}
          >
            {amount > 0 ? `+${amount}` : amount}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted">Amount</Label>
          <Input
            type="number"
            step="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="e.g. 50 or -20"
            className="font-mono"
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

      <Button type="submit" className="mt-5" disabled={saving}>
        {saving ? "Saving..." : "Apply adjustment"}
      </Button>
    </form>
  );
}
