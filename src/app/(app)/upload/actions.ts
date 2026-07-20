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

import { auth } from "@clerk/nextjs/server";

export async function confirmTransaction(input: TransactionConfirmInput) {
  const parsed = transactionConfirmInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid transaction data" };
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
  // A fee the user picked or typed in wins over the auto-computed tier match
  // — never silently overridden once they've made a choice.
  const fee = parsed.data.fee ?? computeFee(parsed.data.amount, feeTierConfig);
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
    notes: parsed.data.notes ?? null,
    created_by: userId,
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

export async function deleteUploadedSource(sourceFileUrl: string) {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "Not authenticated" };

  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  // The upload path is always `${storeId}/...` — refuse to delete anything
  // outside the caller's own store even though this client is service-role.
  if (!sourceFileUrl.startsWith(`${storeId}/`)) {
    return { ok: false as const, error: "Not found" };
  }

  const { error } = await supabase.storage.from("transaction-sources").remove([sourceFileUrl]);
  if (error) return { ok: false as const, error: error.message };

  return { ok: true as const };
}
