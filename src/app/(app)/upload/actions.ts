"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import {
  transactionConfirmInputSchema,
  deriveStatus,
  type TransactionConfirmInput,
} from "@/lib/schemas/transaction";
import { computeFee } from "@/lib/fees";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";

export async function confirmTransaction(input: TransactionConfirmInput) {
  const parsed = transactionConfirmInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid transaction data" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Not authenticated" };
  }

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
  const fee = computeFee(parsed.data.amount, feeTierConfig);
  const status = deriveStatus(parsed.data.confidence);

  const { error } = await supabase.from("transactions").insert({
    store_id: storeId,
    direction: parsed.data.direction,
    category: parsed.data.category,
    amount: parsed.data.amount,
    ref_number: parsed.data.ref_number,
    counterparty_name: parsed.data.counterparty_name ?? null,
    counterparty_number: parsed.data.counterparty_number ?? null,
    occurred_at: parsed.data.occurred_at,
    status,
    fee_computed: fee,
    source_type: parsed.data.source_type,
    source_file_url: parsed.data.source_file_url ?? null,
    confidence: parsed.data.confidence,
    created_by: user.id,
  });

  if (error) {
    // Unique violation on (store_id, ref_number) — duplicate screenshot.
    if (error.code === "23505") {
      return { ok: false as const, error: "A transaction with this reference number already exists" };
    }
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/ledger");
  return { ok: true as const };
}
