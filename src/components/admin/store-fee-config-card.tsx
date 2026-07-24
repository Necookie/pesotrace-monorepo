"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";
import { validateFormula } from "@/lib/fee-formula-validate";
import { resolveFee, describeTier, matchTier } from "@/lib/fees";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import { updateStoreFeeConfig } from "@/app/(admin)/admin/actions";

/**
 * Support-side twin of the store's own fee settings. Same rules, same
 * validation, but reachable by a platform admin who is helping a
 * non-technical owner over the phone — plus an explainer that answers the
 * question support actually gets: "why was I charged this?"
 */
export function StoreFeeConfigCard({
  storeId,
  initialTiers,
  initialFormula,
}: {
  storeId: string;
  initialTiers: FeeTierConfig;
  initialFormula: string | null;
}) {
  const [tiers, setTiers] = useState<FeeTierConfig>(initialTiers);
  const [formula, setFormula] = useState(initialFormula ?? "");
  const [saving, setSaving] = useState(false);
  const [explainAmount, setExplainAmount] = useState("1500");

  const trimmed = formula.trim();
  const validation = useMemo(
    () => (trimmed === "" ? null : validateFormula(trimmed)),
    [trimmed]
  );

  // Mirrors exactly what billing will do, so the number shown here is the
  // number the customer gets charged — including the tier fallback path.
  const explanation = useMemo(() => {
    const amount = Number(explainAmount) || 0;
    const resolution = resolveFee(
      { amount, direction: "send", category: "cash_out" },
      { tiers, formula: trimmed === "" ? null : trimmed }
    );
    const tier = resolution.source === "tiers" ? matchTier(amount, tiers) : undefined;
    return { amount, ...resolution, tier };
  }, [explainAmount, tiers, trimmed]);

  function updateTier(index: number, patch: Partial<FeeTierConfig[number]>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  async function handleSave() {
    if (tiers.length === 0) {
      toast.error("Keep at least one fee tier as a fallback");
      return;
    }
    setSaving(true);
    const result = await updateStoreFeeConfig({
      storeId,
      tiers,
      formula: trimmed === "" ? null : trimmed,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Fee setup updated for this store");
  }

  return (
    <div className="rounded-2xl border border-hairline p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Fee setup</h2>
        <span
          className={cn(
            "rounded-pill px-2.5 py-1 text-xs font-medium",
            trimmed ? "bg-primary/10 text-primary" : "bg-surface-strong text-muted"
          )}
        >
          {trimmed ? "Custom formula" : "Tier table"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Edits here apply to the store owner&apos;s account and are recorded in the audit log.
      </p>

      {/* ---------------------------------------------------------- explainer */}
      <div className="mt-4 rounded-xl bg-surface-soft p-3">
        <Label htmlFor="explain-amount" className="text-xs text-muted">
          Why was this amount charged that fee?
        </Label>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <Input
            id="explain-amount"
            type="number"
            value={explainAmount}
            onChange={(e) => setExplainAmount(e.target.value)}
            className="w-36 bg-canvas"
          />
          <div className="text-sm">
            <span className="text-muted">charges </span>
            <span className="font-mono font-semibold text-ink">
              {formatPeso(explanation.fee)}
            </span>
            <span className="text-muted">
              {explanation.source === "formula"
                ? " via the custom formula"
                : explanation.tier
                  ? ` via tier ${describeTier(explanation.tier)}`
                  : " via the tier table"}
            </span>
          </div>
        </div>
        {explanation.formulaError && (
          <p className="mt-2 text-xs text-down">
            Formula failed ({explanation.formulaError}) — billing fell back to the tiers.
          </p>
        )}
      </div>

      {/* -------------------------------------------------------------- tiers */}
      <div className="mt-5 space-y-3">
        <h3 className="text-xs font-semibold text-body">Fee tiers</h3>
        {tiers.map((tier, i) => (
          <div key={i} className="rounded-xl border border-hairline p-3">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
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
                  className="h-10 w-full rounded-md border border-hairline bg-canvas px-2 text-sm md:h-8"
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
                <span className="font-mono text-xs text-muted">{describeTier(tier)}</span>
                <button
                  type="button"
                  onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}
                  className="flex size-11 shrink-0 items-center justify-center rounded-pill text-muted hover:bg-surface-strong hover:text-down"
                  aria-label="Remove tier"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setTiers((prev) => [...prev, { min: 0, max: null, type: "flat", fee: 10 }])
          }
        >
          Add tier
        </Button>
      </div>

      {/* ------------------------------------------------------------ formula */}
      <div className="mt-5 space-y-1.5">
        <h3 className="text-xs font-semibold text-body">Advanced formula</h3>
        <p className="text-xs text-muted">
          Overrides the tiers above when set. Leave blank to use tiers.
        </p>
        <textarea
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder={"amount <= 500 ? 15 : 20 + ceil((amount - 1000) / 500) * 10"}
          className="w-full rounded-xl border border-hairline bg-canvas p-3 font-mono text-sm text-ink outline-none placeholder:text-muted-soft focus:border-primary"
        />
        {validation && !validation.ok && (
          <p className="rounded-xl bg-down/5 px-3 py-2 text-xs text-down">{validation.error}</p>
        )}
        {validation?.ok && <p className="text-xs text-up">Formula is valid.</p>}
      </div>

      <div className="mt-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || (trimmed !== "" && !validation?.ok)}
        >
          {saving ? "Saving..." : "Save fee setup"}
        </Button>
      </div>
    </div>
  );
}
