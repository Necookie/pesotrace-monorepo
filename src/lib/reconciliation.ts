import type { StatementRow } from "@/lib/schemas/statement";

export type ReconciliationResult = {
  index: number;
  expectedBalance: number;
  statedBalance: number;
  mismatch: boolean;
};

/**
 * Verifies each row's stated balance against the running total implied by
 * the previous row's balance and this row's debit/credit — a free
 * data-integrity check unique to statement imports (screenshots have no
 * running balance to cross-check against).
 *
 * expectedBalance is rounded to 2 decimal places before comparison so that
 * floating-point accumulation errors across a long statement (e.g. 0.1 + 0.2
 * = 0.30000000000000004) do not produce false mismatches. The 0.01 tolerance
 * already covers normal rounding differences; this makes it deterministic.
 */
export function reconcileStatement(rows: StatementRow[]): ReconciliationResult[] {
  const results: ReconciliationResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i === 0) {
      results.push({
        index: i,
        expectedBalance: row.balance,
        statedBalance: row.balance,
        mismatch: false,
      });
      continue;
    }

    const prevBalance = rows[i - 1].balance;
    const rawExpected = prevBalance - (row.debit ?? 0) + (row.credit ?? 0);
    // Round to centavo precision before comparing to avoid floating-point
    // accumulation errors producing a false mismatch (e.g. 0.30000000000000004
    // vs 0.30).
    const expectedBalance = Math.round(rawExpected * 100) / 100;
    const mismatch = Math.abs(expectedBalance - row.balance) > 0.01;

    results.push({ index: i, expectedBalance, statedBalance: row.balance, mismatch });
  }

  return results;
}
