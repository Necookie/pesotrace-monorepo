import { describe, it, expect } from "vitest";
import { creditsForExtraction, USD_PER_CREDIT } from "./pricing";

describe("creditsForExtraction", () => {
  it("charges 1 credit for a typical single-image extraction cost", () => {
    // ~$0.000438, the real cost observed in gemini/pricing.test.ts.
    expect(creditsForExtraction(0.000438)).toBe(1);
  });

  it("charges proportionally more for a pricier statement extraction", () => {
    const statementCost = USD_PER_CREDIT * 12.4;
    expect(creditsForExtraction(statementCost)).toBe(13);
  });

  it("rounds up rather than undercharging on a fractional credit", () => {
    expect(creditsForExtraction(USD_PER_CREDIT * 1.01)).toBe(2);
  });

  it("charges nothing for a zero or negative cost", () => {
    expect(creditsForExtraction(0)).toBe(0);
    expect(creditsForExtraction(-1)).toBe(0);
  });
});
