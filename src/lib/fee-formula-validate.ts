import {
  parseFormula,
  evaluateFormula,
  FormulaError,
  type FormulaContext,
} from "@/lib/fee-formula";
import type { TransactionCategory, TransactionDirection } from "@/lib/database.types";

/**
 * Amounts every formula is exercised against before it can be saved.
 *
 * A fee rule that throws — or returns NaN, a negative, or something absurd —
 * must be caught at edit time, not discovered when a cashier is standing in
 * front of a customer. The set deliberately includes bracket boundaries
 * (200/500/1000), just-past-boundary values, a decimal, and extremes.
 */
export const PROBE_AMOUNTS = [
  0, 1, 100, 200, 200.5, 201, 500, 501, 1000, 1001, 1500, 2000, 5000, 50_000, 1_000_000,
] as const;

const PROBE_DIRECTIONS: TransactionDirection[] = ["send", "receive"];
const PROBE_CATEGORIES: TransactionCategory[] = ["cash_in", "cash_out", "load", "bills", "other"];

export type FormulaProbe = { amount: number; fee: number };

export type FormulaValidation =
  | { ok: true; probes: FormulaProbe[] }
  | { ok: false; error: string; position?: number };

/**
 * A fee larger than the transaction itself is virtually always a mistake
 * (a stray `*` instead of `/`, or a percentage entered as a whole number).
 * Flagged rather than silently accepted, but only above a floor — small
 * transactions legitimately carry a fee bigger than the amount.
 */
const ABSURD_FEE_FLOOR = 1000;

export function validateFormula(source: string): FormulaValidation {
  let ast;
  try {
    ast = parseFormula(source);
  } catch (error) {
    if (error instanceof FormulaError) {
      return { ok: false, error: error.message, position: error.position };
    }
    throw error;
  }

  const probes: FormulaProbe[] = [];

  for (const amount of PROBE_AMOUNTS) {
    // Every direction/category combination runs, so a rule that branches on
    // them cannot hide a broken path behind the default case.
    for (const direction of PROBE_DIRECTIONS) {
      for (const category of PROBE_CATEGORIES) {
        const context: FormulaContext = { amount, direction, category };
        let fee: number;
        try {
          fee = evaluateFormula(ast, context);
        } catch (error) {
          if (error instanceof FormulaError) {
            return {
              ok: false,
              error: `At ₱${amount} (${direction}, ${category}): ${error.message}`,
            };
          }
          throw error;
        }

        if (amount >= ABSURD_FEE_FLOOR && fee > amount) {
          return {
            ok: false,
            error: `At ₱${amount} the fee works out to ₱${fee}, which is more than the transaction itself. Check the formula.`,
          };
        }
      }
    }

    probes.push({
      amount,
      fee: evaluateFormula(ast, {
        amount,
        direction: PROBE_DIRECTIONS[0],
        category: PROBE_CATEGORIES[0],
      }),
    });
  }

  return { ok: true, probes };
}
