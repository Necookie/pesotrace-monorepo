import { Layers, Check, Sparkles } from "lucide-react";
import type { FeeTierConfig } from "@/lib/schemas/fee-tier";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";

export function StoreFeeMatrix({
  customConfig,
}: {
  customConfig: FeeTierConfig | null;
}) {
  const activeTiers = customConfig && customConfig.length > 0 ? customConfig : DEFAULT_FEE_TIER_CONFIG;
  const isCustom = Boolean(customConfig && customConfig.length > 0);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-ink">Fee Tier Structure & Thresholds</h2>
        </div>
        {isCustom ? (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="size-3" />
            Custom Merchant Tiers
          </span>
        ) : (
          <span className="rounded-full bg-surface-strong px-2 py-0.5 text-xs font-medium text-muted">
            Platform Default Tiers
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {activeTiers.map((tier, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-xl border border-hairline bg-surface-soft p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Tier {idx + 1}</span>
              <Check className="size-3.5 text-emerald-600" />
            </div>
            <div className="mt-2">
              <p className="font-mono text-sm font-semibold text-ink">
                ₱{tier.fee.toFixed(2)}{" "}
                <span className="text-xs font-normal text-muted">
                  {tier.type === "per_thousand" ? "per ₱1,000" : "flat fee"}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {tier.max !== null
                  ? `Transactions ₱${tier.min.toLocaleString()} to ₱${tier.max.toLocaleString()}`
                  : `Transactions above ₱${tier.min.toLocaleString()}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
