"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettings } from "@/app/(admin)/admin/actions";

export function PlatformSettingsForm({
  initialThreshold,
  initialDefaultGrant,
}: {
  initialThreshold: number;
  /** Pre-fill value for the trial credit grant amount in the trial requests panel. */
  initialDefaultGrant: number;
}) {
  const router = useRouter();
  const [threshold, setThreshold] = useState(String(initialThreshold));
  const [defaultGrant, setDefaultGrant] = useState(String(initialDefaultGrant));
  const [saving, setSaving] = useState(false);

  const isUnchanged =
    threshold === String(initialThreshold) && defaultGrant === String(initialDefaultGrant);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedThreshold = Number(threshold);
    const parsedGrant = Number(defaultGrant);
    if (!Number.isFinite(parsedThreshold) || parsedThreshold < 0) {
      toast.error("Enter a valid, non-negative threshold");
      return;
    }
    if (!Number.isFinite(parsedGrant) || parsedGrant <= 0) {
      toast.error("Enter a positive default grant amount");
      return;
    }

    setSaving(true);
    const result = await updatePlatformSettings({
      lowBalanceThreshold: parsedThreshold,
      defaultGrantAmount: parsedGrant,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-hairline p-4 sm:p-6 space-y-6">
      <div>
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
      </div>

      <div className="border-t border-hairline pt-6">
        <h2 className="text-sm font-semibold text-ink">Default trial grant amount</h2>
        <p className="mt-1.5 text-xs text-muted">
          Pre-fills the grant amount on the trial requests panel when an operator approves a trial request.
          Override per-request as needed before approving.
        </p>
        <div className="mt-4 max-w-40 space-y-1.5">
          <Label className="text-xs text-muted">Credits to grant</Label>
          <Input
            type="number"
            step="1"
            min="1"
            value={defaultGrant}
            onChange={(e) => setDefaultGrant(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <Button type="submit" disabled={saving || isUnchanged}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
