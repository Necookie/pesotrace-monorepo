import { describe, it, expect } from "vitest";
import { reconcileStatement } from "./reconciliation";
import type { StatementRow } from "./schemas/statement";

function row(overrides: Partial<StatementRow>): StatementRow {
  return {
    occurred_at: "2026-04-22T12:27:00",
    description: "Transfer",
    ref_number: "ref",
    balance: 0,
    category: "other",
    ...overrides,
  };
}

describe("reconcileStatement", () => {
  it("flags no mismatch when balances follow debit/credit correctly", () => {
    const rows = [
      row({ balance: 547.92 }),
      row({ debit: 79, balance: 468.92 }),
      row({ debit: 200, balance: 268.92 }),
      row({ credit: 125, balance: 393.92 }),
    ];
    const result = reconcileStatement(rows);
    expect(result.every((r) => !r.mismatch)).toBe(true);
  });

  it("flags a mismatch when a row's balance doesn't follow from the prior row", () => {
    const rows = [
      row({ balance: 547.92 }),
      row({ debit: 79, balance: 468.92 }),
      // Should be 268.92 (468.92 - 200), but statement says 300 — mis-parsed.
      row({ debit: 200, balance: 300 }),
    ];
    const result = reconcileStatement(rows);
    expect(result[0].mismatch).toBe(false);
    expect(result[1].mismatch).toBe(false);
    expect(result[2].mismatch).toBe(true);
    expect(result[2].expectedBalance).toBeCloseTo(268.92);
  });
});
