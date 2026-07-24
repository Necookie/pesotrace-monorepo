import { describe, it, expect } from "vitest";
import { computeFee, matchTier } from "./fees";
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
