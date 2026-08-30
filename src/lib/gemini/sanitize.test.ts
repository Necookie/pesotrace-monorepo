import { describe, it, expect } from "vitest";
import { sanitizeExtractionPayload } from "./sanitize";
import { extractedTransactionSchema } from "@/lib/schemas/transaction";

describe("sanitizeExtractionPayload", () => {
  it("cleans comma-separated currency amounts (e.g. 'PHP 1,500.00' -> 1500)", () => {
    const raw = {
      direction: "send",
      category: "cash_out",
      amount: "PHP 1,500.00",
      ref_number: "9876543210",
      occurred_at: "2026-08-30T18:00:00",
      confidence: 1,
    };
    const sanitized = sanitizeExtractionPayload(raw);
    expect(sanitized.amount).toBe(1500);
    expect(extractedTransactionSchema.safeParse(sanitized).success).toBe(true);
  });

  it("coerces integer reference numbers to strings", () => {
    const raw = {
      direction: "receive",
      category: "cash_in",
      amount: 500,
      ref_number: 10023456789,
      occurred_at: "2026-08-30T18:00:00",
      confidence: 0.9,
    };
    const sanitized = sanitizeExtractionPayload(raw);
    expect(sanitized.ref_number).toBe("10023456789");
    expect(extractedTransactionSchema.safeParse(sanitized).success).toBe(true);
  });

  it("normalizes 12-hour AM/PM timestamps to 24-hour ISO format", () => {
    const raw = {
      direction: "send",
      category: "other",
      amount: 250,
      ref_number: "REF123",
      occurred_at: "2026-08-30 3:45 PM",
      confidence: 0.9,
    };
    const sanitized = sanitizeExtractionPayload(raw);
    expect(sanitized.occurred_at).toBe("2026-08-30T15:45:00");
    expect(extractedTransactionSchema.safeParse(sanitized).success).toBe(true);
  });

  it("fills in default confidence when missing or null", () => {
    const raw = {
      direction: "send",
      category: "other",
      amount: 100,
      ref_number: "REF999",
      occurred_at: "2026-08-30T10:00:00",
      confidence: null,
    };
    const sanitized = sanitizeExtractionPayload(raw);
    expect(sanitized.confidence).toBe(0.85);
    expect(extractedTransactionSchema.safeParse(sanitized).success).toBe(true);
  });
});
