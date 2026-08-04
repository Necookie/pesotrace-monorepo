"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettings } from "@/app/(admin)/admin/actions";

export function PlatformSettingsForm({ initialThreshold }: { initialThreshold: number }) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(String(initialThreshold));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(threshold);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter a valid, non-negative number");
      return;
    }

    setSaving(true);
    const result = await updatePlatformSettings({ lowBalanceThreshold: parsed });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Low-balance threshold</h2>
      <p className="mt-1.5 text-xs text-muted">
        The credit balance at or below which a store gets a low-balance email (and shows up in the operator
        digest). Checked once a day by the cron sweep.
      </p>

      <div className="mt-4 max-w-40 space-y-1.5">
        <Label className="text-xs text-muted">Threshold (credits)</Label>
        <Input
          type="number"
          step="1"
          min="0"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="font-mono"
        />
      </div>

      <Button type="submit" className="mt-4" disabled={saving || threshold === String(initialThreshold)}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
