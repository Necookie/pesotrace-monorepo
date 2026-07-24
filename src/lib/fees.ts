import type { FeeTierConfig, FeeTier } from "@/lib/schemas/fee-tier";
import {
  parseFormula,
  evaluateFormula,
  FormulaError,
  type Node,
  type FormulaContext,
} from "@/lib/fee-formula";

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
 * config. Tiers are matched by matchTier (max inclusive, null = unbounded).
 * `per_thousand` rounds up to the nearest ₱1,000 bracket before multiplying,
 * matching how remittance shops quote fees in practice (e.g. ₱20 per ₱1,000
 * charges ₱40 for a ₱1,500 transaction, not ₱30).
 *
 * Stores with a custom formula should go through resolveFee instead.
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

// A bulk statement import calls resolveFee once per row against the same
// formula, so parse each distinct source once instead of per transaction.
// Bounded so a pathological set of formulas can't grow it without limit.
const AST_CACHE_LIMIT = 32;
const astCache = new Map<string, Node>();

function parseCached(source: string): Node {
  const hit = astCache.get(source);
  if (hit) return hit;

  const ast = parseFormula(source);
  if (astCache.size >= AST_CACHE_LIMIT) {
    astCache.delete(astCache.keys().next().value as string);
  }
  astCache.set(source, ast);
  return ast;
}

export type FeeSource = "formula" | "tiers";

export type FeeResolution = {
  fee: number;
  source: FeeSource;
  /**
   * Set when a formula was configured but could not be billed, so the fee
   * below came from the tier table instead. Callers should surface this and
   * flag the transaction rather than treating it as a normal result.
   */
  formulaError?: string;
};

export type StoreFeeConfig = {
  tiers: FeeTierConfig;
  formula?: string | null;
};

/**
 * The single entry point for "what does this store charge for this
 * transaction". A custom formula wins when present; otherwise the tier table
 * applies.
 *
 * A formula that throws at runtime falls back to the tiers and reports the
 * error — it never charges ₱0 and never blocks the transaction. Formulas are
 * validated on save, so this path should be unreachable in practice, but the
 * consequence of being wrong here is a mischarged customer, so it degrades
 * instead of trusting.
 */
export function resolveFee(
  context: FormulaContext,
  config: StoreFeeConfig
): FeeResolution {
  const formula = config.formula?.trim();

  if (formula) {
    try {
      return { fee: evaluateFormula(parseCached(formula), context), source: "formula" };
    } catch (error) {
      return {
        fee: computeFee(context.amount, config.tiers),
        source: "tiers",
        formulaError:
          error instanceof FormulaError ? error.message : "Fee formula failed to evaluate",
      };
    }
  }

  return { fee: computeFee(context.amount, config.tiers), source: "tiers" };
}
