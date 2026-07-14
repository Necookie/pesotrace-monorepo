"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import { updateFeeTiers } from "@/app/(app)/settings/actions";

export function FeeTierTable({ initial }: { initial: FeeTierConfig }) {
  const [tiers, setTiers] = useState<FeeTierConfig>(initial);
  const [saving, setSaving] = useState(false);

  function updateTier(index: number, patch: Partial<FeeTierConfig[number]>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTier() {
    setTiers((prev) => [
      ...prev,
      { min: 0, max: null, type: "per_thousand", fee: 20 },
    ]);
  }

  async function handleSave() {
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
    <div className="rounded-2xl border border-hairline p-6">
      <h2 className="text-sm font-semibold text-ink">Fee tiers</h2>
      <p className="mt-1 text-xs text-muted">
        Applied to new transactions only — not retroactive.
      </p>

      <div className="mt-4 space-y-3">
        {tiers.map((tier, i) => (
          <div key={i} className="grid grid-cols-4 items-center gap-2">
            <Input
              type="number"
              value={tier.min}
              onChange={(e) => updateTier(i, { min: Number(e.target.value) })}
              placeholder="Min"
            />
            <select
              value={tier.type}
              onChange={(e) =>
                updateTier(i, { type: e.target.value as "flat" | "per_thousand" })
              }
              className="h-10 rounded-md border border-hairline bg-canvas px-2 text-sm"
            >
              <option value="per_thousand">₱ per ₱1,000</option>
              <option value="flat">Flat fee</option>
            </select>
            <Input
              type="number"
              value={tier.fee}
              onChange={(e) => updateTier(i, { fee: Number(e.target.value) })}
              placeholder="Fee"
            />
            <span className="text-xs text-muted">
              {tier.type === "flat" ? `₱${tier.fee} flat` : `₱${tier.fee} / ₱1,000`}
            </span>
          </div>
        ))}
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
