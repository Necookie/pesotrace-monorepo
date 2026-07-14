import { describe, it, expect } from "vitest";
import { computeFee } from "./fees";
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
});
