import { z } from "zod";
import { transactionCategorySchema } from "@/lib/schemas/transaction";

/**
 * A single row parsed from a GCash statement export (PDF/CSV). debit/credit
 * come straight from the statement's own columns — direction is derived
 * from which one is set, not inferred by the model.
 */
export const statementRowSchema = z
  .object({
    occurred_at: z.string().min(1),
    description: z.string(),
    ref_number: z.string().min(1),
    debit: z.coerce.number().min(0).optional(),
    credit: z.coerce.number().min(0).optional(),
    balance: z.coerce.number(),
    category: transactionCategorySchema,
    counterparty_name: z.string().nullable().optional(),
    counterparty_number: z.string().nullable().optional(),
  })
  .refine((row) => (row.debit ?? 0) > 0 || (row.credit ?? 0) > 0, {
    message: "Row must have either a debit or a credit amount",
  });

export type StatementRow = z.infer<typeof statementRowSchema>;

export const statementExtractionSchema = z.object({
  transactions: z.array(statementRowSchema),
});

/** Derives the same direction/amount shape the screenshot flow already uses. */
export function statementRowToTransaction(row: StatementRow) {
  const direction = (row.debit ?? 0) > 0 ? ("send" as const) : ("receive" as const);
  const amount = direction === "send" ? row.debit! : row.credit!;
  return { direction, amount };
}
