"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { statementRowSchema, statementRowToTransaction, type StatementRow } from "@/lib/schemas/statement";
import { reconcileStatement } from "@/lib/reconciliation";
import { computeFee } from "@/lib/fees";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";

import { auth } from "@clerk/nextjs/server";

export async function confirmStatementImport(rows: StatementRow[], sourceFileUrl: string | null) {
  const parsed = rows.map((r) => statementRowSchema.safeParse(r));
  if (parsed.some((p) => !p.success)) {
    return { ok: false as const, error: "Some rows failed validation" };
  }

  const { userId } = await auth();
  if (!userId) {
    return { ok: false as const, error: "Not authenticated" };
  }

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) {
    return { ok: false as const, error: "No store found" };
  }

  const { data: store } = await supabase
    .from("stores")
    .select("fee_tier_config")
    .eq("id", storeId)
    .single();
  const feeTierConfig = store?.fee_tier_config ?? DEFAULT_FEE_TIER_CONFIG;

  const reconciliation = reconcileStatement(rows);

  const records = rows.map((row, i) => {
    const { direction, amount } = statementRowToTransaction(row);
    // A balance mismatch means this row (or a neighbor) may be mis-parsed —
    // flag it for manual review instead of trusting it silently.
    const status = reconciliation[i]?.mismatch ? "needs_review" : "confirmed";

    return {
      store_id: storeId,
      direction,
      category: row.category,
      amount,
      ref_number: row.ref_number,
      counterparty_name: row.counterparty_name ?? null,
      counterparty_number: row.counterparty_number ?? null,
      occurred_at: row.occurred_at,
      status: status as "needs_review" | "confirmed",
      fee_computed: computeFee(amount, feeTierConfig),
      source_type: "statement" as const,
      source_file_url: sourceFileUrl,
      confidence: null,
      notes: reconciliation[i]?.mismatch
        ? `Balance mismatch: expected ${reconciliation[i].expectedBalance.toFixed(2)}, statement shows ${reconciliation[i].statedBalance.toFixed(2)}`
        : null,
      created_by: userId,
    };
  });

  // Duplicate ref numbers (re-importing an overlapping statement period) are
  // silently skipped rather than erroring the whole batch.
  const { data: inserted, error } = await supabase
    .from("transactions")
    .upsert(records, { onConflict: "store_id,ref_number", ignoreDuplicates: true })
    .select("id");

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/ledger");

  return {
    ok: true as const,
    insertedCount: inserted?.length ?? 0,
    skippedCount: records.length - (inserted?.length ?? 0),
    needsReviewCount: records.filter((r) => r.status === "needs_review").length,
  };
}
