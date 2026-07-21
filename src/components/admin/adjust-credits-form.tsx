"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustStoreCredits } from "@/app/(admin)/admin/actions";

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
      <p className="mt-1 text-xs text-muted">
        Positive to grant/top up, negative to remove. A note is required for the audit trail.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
        <Input
          type="number"
          step="1"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="e.g. 50 or -20"
          className="font-mono"
        />
        <Input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason (e.g. approved trial, manual top-up)"
        />
      </div>

      <Button type="submit" className="mt-4" disabled={saving}>
        {saving ? "Saving..." : "Apply adjustment"}
      </Button>
    </form>
  );
}
