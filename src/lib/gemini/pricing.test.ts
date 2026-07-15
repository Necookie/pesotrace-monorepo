import { describe, it, expect } from "vitest";
import { computeExtractionCost } from "./pricing";

describe("computeExtractionCost", () => {
  it("computes cost from real usageMetadata shape", () => {
    // Actual values observed from a live gemini-flash-lite-latest call.
    const result = computeExtractionCost({ promptTokenCount: 1087, candidatesTokenCount: 111 });
    expect(result.inputTokens).toBe(1087);
    expect(result.outputTokens).toBe(111);
    expect(result.costUsd).toBeCloseTo(1087 * (0.25 / 1_000_000) + 111 * (1.5 / 1_000_000), 10);
  });

  it("returns zero cost when usage metadata is missing", () => {
    const result = computeExtractionCost(undefined);
    expect(result).toEqual({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
  });
});
