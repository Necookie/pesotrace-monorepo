import { z } from "zod";

/**
 * Category matches how the store already classifies transactions on their
 * paper daily-summary sheet (Cash In / Cash Out / Load / Bills / Other),
 * distinct from `direction` which just drives balance math (send/receive
 * from the store's own GCash wallet).
 */
export const transactionCategorySchema = z.enum([
  "cash_in",
  "cash_out",
  "load",
  "bills",
  "other",
]);
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  cash_in: "Cash In",
  cash_out: "Cash Out",
  load: "Load",
  bills: "Bills",
  other: "Other",
};

/**
 * Single source of truth for the fields Gemini extracts and the user edits
 * in the upload review card. Reused for: (1) validating Gemini's response,
 * (2) the review form's zodResolver, (3) the base that the insert schema
 * extends. Keep this file free of server-only imports.
 */
export const extractedTransactionSchema = z.object({
  direction: z.enum(["send", "receive"]),
  category: transactionCategorySchema,
  amount: z.coerce.number().positive(),
  ref_number: z.string().min(1, "Reference number is required"),
  counterparty_name: z.string().nullable().optional(),
  counterparty_number: z.string().nullable().optional(),
  occurred_at: z.string().min(1, "Date/time is required"),
  confidence: z.coerce.number().min(0).max(1),
});

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>;

export const transactionSourceSchema = z.enum(["screenshot", "statement", "manual"]);
export const transactionStatusSchema = z.enum(["needs_review", "confirmed"]);

/**
 * What the client actually submits to the confirm server action. Server-only
 * fields (store_id, created_by, fee_computed, status) are filled in server-side
 * and never trusted from the client.
 */
export const transactionConfirmInputSchema = extractedTransactionSchema.extend({
  source_type: transactionSourceSchema,
  source_file_url: z.string().nullable().optional(),
});

export type TransactionConfirmInput = z.infer<typeof transactionConfirmInputSchema>;

export const transactionRowSchema = extractedTransactionSchema.extend({
  id: z.string(),
  store_id: z.string(),
  status: transactionStatusSchema,
  fee_computed: z.coerce.number(),
  source_type: transactionSourceSchema,
  source_file_url: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.string(),
});

export type TransactionRow = z.infer<typeof transactionRowSchema>;

/** Below this confidence, a transaction is flagged for manual review. */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.85;

export function deriveStatus(confidence: number): "needs_review" | "confirmed" {
  return confidence < CONFIDENCE_REVIEW_THRESHOLD ? "needs_review" : "confirmed";
}

/** Last 4 digits of the reference number — the store's own quick-lookup shorthand. */
export function last4Ref(refNumber: string): string {
  return refNumber.slice(-4);
}
