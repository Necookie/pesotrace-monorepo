"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";

export async function confirmReview(transactionId: string) {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { error } = await supabase
    .from("transactions")
    .update({ status: "confirmed" })
    .eq("id", transactionId)
    .eq("store_id", storeId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/ledger");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function getTransactionDetail(transactionId: string) {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);
  if (!storeId) return null;

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("store_id", storeId)
    .single();

  if (!transaction) return null;

  let signedUrl: string | null = null;
  if (transaction.source_file_url) {
    const { data: signed } = await supabase.storage
      .from("transaction-sources")
      .createSignedUrl(transaction.source_file_url, 300);
    signedUrl = signed?.signedUrl ?? null;
  }

  return { transaction, signedUrl };
}
