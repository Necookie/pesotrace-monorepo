import type { FeeTierConfig, FeeTier } from "@/lib/schemas/fee-tier";

/**
 * Finds the tier that applies to `amount`.
 *
 * `max` is INCLUSIVE, matching how fee boards are actually written and how the
 * settings UI documents them ("₱501–1,000 → ₱15"). This used to be exclusive
 * (`amount < t.max`), which meant a schedule entered as 0–200 / 201–500 /
 * 501–1000 matched nothing at exactly ₱500 or ₱1,000 — and the old
 * `?? feeTierConfig[0]` fallback then silently charged the *cheapest* tier for
 * the two roundest, most common amounts a customer hands over.
 *
 * When no range covers the amount at all (a genuine gap, e.g. ₱200.50 between
 * a 0–200 and a 201–500 tier), fall back to the nearest tier *below* it rather
 * than to the first tier in the array.
 */
export function matchTier(amount: number, feeTierConfig: FeeTierConfig): FeeTier | undefined {
  const byMin = [...feeTierConfig].sort((a, b) => a.min - b.min);

  const covering = byMin.find((t) => amount >= t.min && (t.max === null || amount <= t.max));
  if (covering) return covering;

  const nearestBelow = [...byMin].reverse().find((t) => amount >= t.min);
  return nearestBelow ?? byMin[0];
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
  // Shares matchTier's resolution so the fee charged can never disagree with
  // the tier the UI shows the cashier — these were two separate copies of the
  // matching rule before.
  const tier = matchTier(amount, feeTierConfig);

  if (!tier) return 0;

  if (tier.type === "flat") {
    return tier.fee;
  }

  const brackets = Math.ceil(amount / 1000);
  return brackets * tier.fee;
}
