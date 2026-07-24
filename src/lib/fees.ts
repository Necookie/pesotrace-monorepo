import { DEFAULT_FEE_TIER_CONFIG, type FeeTierConfig, type FeeTier } from "@/lib/schemas/fee-tier";
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

/** Amounts an operator scans to sanity-check a store's schedule at a glance. */
export const FEE_SAMPLE_AMOUNTS = [200, 500, 1000, 1500] as const;

export type FeeConfigSummary = {
  mode: FeeSource;
  /** Short badge text, e.g. "Custom formula" or "3 tiers". */
  label: string;
  /** One-line human description of the actual rule. */
  detail: string;
  /** True when the store has never touched the shipped default. */
  isDefault: boolean;
  /** What common amounts cost under this config, for at-a-glance sanity checks. */
  samples: { amount: number; fee: number }[];
  /** Set when the saved formula no longer evaluates — support should see this. */
  formulaError?: string;
};

function isDefaultTierConfig(tiers: FeeTierConfig): boolean {
  if (tiers.length !== DEFAULT_FEE_TIER_CONFIG.length) return false;
  return tiers.every((tier, i) => {
    const base = DEFAULT_FEE_TIER_CONFIG[i];
    return (
      tier.min === base.min &&
      tier.max === base.max &&
      tier.type === base.type &&
      tier.fee === base.fee
    );
  });
}

/**
 * Describes a store's fee setup for support surfaces — the admin overview
 * list and store detail page — without making the operator open an editor to
 * find out what a store actually charges.
 *
 * Samples run through resolveFee, so what an operator reads here is what
 * billing would really do, including the tier-fallback path when a saved
 * formula has stopped evaluating.
 */
export function summarizeFeeConfig(config: StoreFeeConfig): FeeConfigSummary {
  const formula = config.formula?.trim();

  const samples = FEE_SAMPLE_AMOUNTS.map((amount) => ({
    amount,
    fee: resolveFee({ amount, direction: "send", category: "cash_out" }, config).fee,
  }));

  if (formula) {
    // Probe once to surface a formula that has stopped working — otherwise it
    // silently bills from tiers and nobody notices until a customer complains.
    const probe = resolveFee(
      { amount: 1000, direction: "send", category: "cash_out" },
      config
    );

    return {
      mode: "formula",
      label: "Custom formula",
      detail: formula.replace(/\s+/g, " ").trim(),
      isDefault: false,
      samples,
      formulaError: probe.formulaError,
    };
  }

  return {
    mode: "tiers",
    label: `${config.tiers.length} tier${config.tiers.length === 1 ? "" : "s"}`,
    detail: config.tiers.map(describeTier).join(" · "),
    isDefault: isDefaultTierConfig(config.tiers),
    samples,
  };
}
