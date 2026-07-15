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
    const expectedBalance = prevBalance - (row.debit ?? 0) + (row.credit ?? 0);
    const mismatch = Math.abs(expectedBalance - row.balance) > 0.01;

    results.push({ index: i, expectedBalance, statedBalance: row.balance, mismatch });
  }

  return results;
}
