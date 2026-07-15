"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import { updateFeeTiers } from "@/app/(app)/settings/actions";

export function FeeTierTable({ initial }: { initial: FeeTierConfig }) {
  const [tiers, setTiers] = useState<FeeTierConfig>(initial);
  const [saving, setSaving] = useState(false);

  function updateTier(index: number, patch: Partial<FeeTierConfig[number]>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTier() {
    setTiers((prev) => [...prev, { min: 0, max: null, type: "flat", fee: 10 }]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (tiers.length === 0) {
      toast.error("Keep at least one fee tier");
      return;
    }
    setSaving(true);
    const result = await updateFeeTiers(tiers);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Fee tiers updated");
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <h2 className="text-sm font-semibold text-ink">Fee tiers</h2>
      <p className="mt-1 text-xs text-muted">
        Define your own charge ranges (e.g. ₱100–500 → ₱10, ₱501–1,000 → ₱15, ₱1,000+ → ₱20 per
        ₱1,000). Leave Max blank for &quot;and up.&quot; Applied to new transactions only — not
        retroactive.
      </p>

      <div className="mt-4 space-y-4">
        {tiers.map((tier, i) => (
          <div key={i} className="rounded-xl border border-hairline p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-1">
                <Label className="text-xs text-muted">Min (₱)</Label>
                <Input
                  type="number"
                  value={tier.min}
                  onChange={(e) => updateTier(i, { min: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted">Max (₱)</Label>
                <Input
                  type="number"
                  value={tier.max ?? ""}
                  placeholder="No limit"
                  onChange={(e) =>
                    updateTier(i, { max: e.target.value === "" ? null : Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted">Type</Label>
                <select
                  value={tier.type}
                  onChange={(e) =>
                    updateTier(i, { type: e.target.value as "flat" | "per_thousand" })
                  }
                  className="h-10 w-full rounded-md border border-hairline bg-canvas px-2 text-sm"
                >
                  <option value="flat">Flat fee</option>
                  <option value="per_thousand">₱ per ₱1,000</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted">Fee (₱)</Label>
                <Input
                  type="number"
                  value={tier.fee}
                  onChange={(e) => updateTier(i, { fee: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end justify-between gap-2">
                <span className="font-mono text-xs text-muted">
                  {tier.type === "flat" ? `₱${tier.fee} flat` : `₱${tier.fee} / ₱1,000`}
                </span>
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-strong hover:text-down"
                  aria-label="Remove tier"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {tiers.length === 0 && (
          <p className="text-sm text-muted">No tiers configured — add one below.</p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" onClick={addTier}>
          Add tier
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
