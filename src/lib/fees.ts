import type { FeeTierConfig, FeeTier } from "@/lib/schemas/fee-tier";

/** Finds the tier that would apply to `amount`, for display purposes. */
export function matchTier(amount: number, feeTierConfig: FeeTierConfig): FeeTier | undefined {
  return (
    feeTierConfig.find((t) => amount >= t.min && (t.max === null || amount < t.max)) ??
    feeTierConfig[0]
  );
}

export function describeTier(tier: FeeTier): string {
  const range = tier.max === null ? `₱${tier.min}+` : `₱${tier.min}–${tier.max}`;
  const rate = tier.type === "flat" ? `₱${tier.fee} flat` : `₱${tier.fee} / ₱1,000`;
  return `${range} → ${rate}`;
}

/**
 * Computes the remittance fee for a given amount against a store's tier
 * config. Tiers are matched by `amount` falling within [min, max) (max=null
 * means unbounded). `per_thousand` rounds up to the nearest ₱1,000 bracket
 * before multiplying, matching how remittance shops quote fees in practice
 * (e.g. ₱20 per ₱1,000 charges ₱40 for a ₱1,500 transaction, not ₱30).
 */
export function computeFee(amount: number, feeTierConfig: FeeTierConfig): number {
  const tier =
    feeTierConfig.find(
      (t) => amount >= t.min && (t.max === null || amount < t.max)
    ) ?? feeTierConfig[0];

  if (!tier) return 0;

  if (tier.type === "flat") {
    return tier.fee;
  }

  const brackets = Math.ceil(amount / 1000);
  return brackets * tier.fee;
}
