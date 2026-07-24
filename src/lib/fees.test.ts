import { describe, it, expect } from "vitest";
import { computeFee, matchTier, resolveFee } from "./fees";
import { DEFAULT_FEE_TIER_CONFIG } from "./schemas/fee-tier";

describe("computeFee", () => {
  it("charges one bracket for amounts under 1000", () => {
    expect(computeFee(263.99, DEFAULT_FEE_TIER_CONFIG)).toBe(20);
    expect(computeFee(1, DEFAULT_FEE_TIER_CONFIG)).toBe(20);
  });

  it("rounds up to the next ₱1,000 bracket", () => {
    expect(computeFee(1000, DEFAULT_FEE_TIER_CONFIG)).toBe(20);
    expect(computeFee(1010, DEFAULT_FEE_TIER_CONFIG)).toBe(40);
    expect(computeFee(1500, DEFAULT_FEE_TIER_CONFIG)).toBe(40);
    expect(computeFee(2000, DEFAULT_FEE_TIER_CONFIG)).toBe(40);
    expect(computeFee(2001, DEFAULT_FEE_TIER_CONFIG)).toBe(60);
  });

  it("supports flat fee tiers", () => {
    const flatConfig = [{ min: 0, max: null, type: "flat" as const, fee: 15 }];
    expect(computeFee(50000, flatConfig)).toBe(15);
    expect(computeFee(1, flatConfig)).toBe(15);
  });

  it("picks the matching tier by amount range", () => {
    const tiered = [
      { min: 0, max: 1000, type: "flat" as const, fee: 10 },
      { min: 1000, max: null, type: "per_thousand" as const, fee: 20 },
    ];
    expect(computeFee(500, tiered)).toBe(10);
    expect(computeFee(1500, tiered)).toBe(40);
  });

  // A schedule written the way a store owner would write it on a fee board.
  const board = [
    { min: 0, max: 200, type: "flat" as const, fee: 10 },
    { min: 201, max: 500, type: "flat" as const, fee: 15 },
    { min: 501, max: 1000, type: "flat" as const, fee: 20 },
  ];

  it("treats tier max as inclusive at exact bracket boundaries", () => {
    // Regression: these fell through every tier and silently charged tier 1's
    // ₱10, because matching used `amount < max`.
    expect(computeFee(500, board)).toBe(15);
    expect(computeFee(1000, board)).toBe(20);
  });

  it("charges the correct tier across each band", () => {
    expect(computeFee(1, board)).toBe(10);
    expect(computeFee(200, board)).toBe(10);
    expect(computeFee(201, board)).toBe(15);
    expect(computeFee(499, board)).toBe(15);
    expect(computeFee(501, board)).toBe(20);
    expect(computeFee(999, board)).toBe(20);
  });

  it("falls back to the nearest tier below when a gap swallows the amount", () => {
    // ₱200.50 sits in the gap between the 0–200 and 201–500 tiers. It should
    // take the tier below it (₱10), not whichever tier happens to be first.
    expect(computeFee(200.5, board)).toBe(10);
  });

  it("uses the highest tier for amounts past the last bounded tier", () => {
    // Nothing covers ₱5,000 — the top tier is capped at 1000 — so it takes the
    // nearest tier below rather than the cheapest one.
    expect(computeFee(5000, board)).toBe(20);
  });

  it("resolves tiers independently of the order they are stored in", () => {
    const shuffled = [board[2], board[0], board[1]];
    expect(computeFee(500, shuffled)).toBe(15);
    expect(computeFee(1000, shuffled)).toBe(20);
    expect(computeFee(100, shuffled)).toBe(10);
  });
});

describe("matchTier", () => {
  const board = [
    { min: 0, max: 200, type: "flat" as const, fee: 10 },
    { min: 201, max: 500, type: "flat" as const, fee: 15 },
  ];

  it("returns the same tier computeFee bills, at a boundary", () => {
    expect(matchTier(500, board)).toEqual(board[1]);
    expect(matchTier(200, board)).toEqual(board[0]);
  });
});

describe("resolveFee", () => {
  const tiers = [
    { min: 0, max: 1000, type: "flat" as const, fee: 20 },
    { min: 1001, max: null, type: "flat" as const, fee: 50 },
  ];

  const context = (amount: number) => ({
    amount,
    direction: "send" as const,
    category: "cash_out" as const,
  });

  it("uses the tier table when no formula is set", () => {
    expect(resolveFee(context(500), { tiers })).toEqual({ fee: 20, source: "tiers" });
    expect(resolveFee(context(500), { tiers, formula: null })).toEqual({
      fee: 20,
      source: "tiers",
    });
    // Whitespace-only is treated as unset, not as a syntax error.
    expect(resolveFee(context(500), { tiers, formula: "   " })).toEqual({
      fee: 20,
      source: "tiers",
    });
  });

  it("prefers the formula over the tiers when one is set", () => {
    const result = resolveFee(context(1500), {
      tiers,
      formula: "20 + ceil((amount - 1000) / 500) * 10",
    });
    expect(result).toEqual({ fee: 30, source: "formula" });
  });

  it("passes direction and category through to the formula", () => {
    const formula = 'direction == "receive" ? 5 : category == "bills" ? 8 : 12';
    expect(
      resolveFee({ amount: 100, direction: "receive", category: "other" }, { tiers, formula }).fee
    ).toBe(5);
    expect(
      resolveFee({ amount: 100, direction: "send", category: "bills" }, { tiers, formula }).fee
    ).toBe(8);
    expect(
      resolveFee({ amount: 100, direction: "send", category: "other" }, { tiers, formula }).fee
    ).toBe(12);
  });

  it("falls back to the tiers and reports the error when a formula throws", () => {
    const result = resolveFee(context(500), { tiers, formula: "10 / (amount - 500)" });
    expect(result.source).toBe("tiers");
    expect(result.fee).toBe(20);
    expect(result.formulaError).toMatch(/Division by zero/);
  });

  it("falls back rather than charging zero when a formula is malformed", () => {
    const result = resolveFee(context(500), { tiers, formula: "amount +" });
    expect(result.source).toBe("tiers");
    expect(result.fee).toBe(20);
    expect(result.formulaError).toBeTruthy();
  });

  it("falls back when a formula produces a negative fee", () => {
    const result = resolveFee(context(500), { tiers, formula: "amount - 10000" });
    expect(result.source).toBe("tiers");
    expect(result.fee).toBe(20);
    expect(result.formulaError).toMatch(/negative/);
  });

  it("returns consistent results across repeated calls with the same formula", () => {
    // Exercises the AST cache — a bulk import hits this path once per row.
    const formula = "amount <= 500 ? 15 : 25";
    for (let i = 0; i < 5; i++) {
      expect(resolveFee(context(100), { tiers, formula }).fee).toBe(15);
      expect(resolveFee(context(900), { tiers, formula }).fee).toBe(25);
    }
  });
});
