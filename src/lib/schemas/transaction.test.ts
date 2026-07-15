import { describe, it, expect } from "vitest";
import { extractedTransactionSchema, deriveStatus } from "./transaction";

describe("extractedTransactionSchema", () => {
  it("accepts a valid Gemini extraction payload", () => {
    const result = extractedTransactionSchema.safeParse({
      direction: "send",
      category: "cash_out",
      amount: 1010,
      ref_number: "5042814017377",
      counterparty_name: "GoTyme Bank",
      counterparty_number: "9848",
      occurred_at: "2026-07-12T17:58:00",
      confidence: 1,
    });
    expect(result.success).toBe(true);
  });

  it("coerces numeric strings for amount and confidence", () => {
    const result = extractedTransactionSchema.safeParse({
      direction: "receive",
      category: "cash_in",
      amount: "1600.00",
      ref_number: "4042548978339",
      occurred_at: "2026-07-04T21:43:00",
      confidence: "0.95",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(1600);
      expect(result.data.confidence).toBe(0.95);
    }
  });

  it("rejects a missing reference number", () => {
    const result = extractedTransactionSchema.safeParse({
      direction: "send",
      amount: 100,
      ref_number: "",
      occurred_at: "2026-07-12T17:58:00",
      confidence: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid direction", () => {
    const result = extractedTransactionSchema.safeParse({
      direction: "sideways",
      amount: 100,
      ref_number: "123",
      occurred_at: "2026-07-12T17:58:00",
      confidence: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("deriveStatus", () => {
  it("flags low-confidence extractions for review", () => {
    expect(deriveStatus(0.5)).toBe("needs_review");
    expect(deriveStatus(0.84)).toBe("needs_review");
  });

  it("confirms high-confidence extractions", () => {
    expect(deriveStatus(0.85)).toBe("confirmed");
    expect(deriveStatus(1)).toBe("confirmed");
  });
});
