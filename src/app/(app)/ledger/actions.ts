"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";

export async function confirmReview(transactionId: string) {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();
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
  const storeId = await getCurrentStoreId();
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

export async function updateTransaction(
  transactionId: string,
  input: {
    direction: "send" | "receive";
    category: "cash_in" | "cash_out" | "load" | "bills" | "other";
    amount: number;
    ref_number: string;
    counterparty_name?: string | null;
    counterparty_number?: string | null;
    fee_computed: number;
    status: "needs_review" | "confirmed";
    notes?: string | null;
  }
) {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false as const, error: "No store found" };

  const { error } = await supabase
    .from("transactions")
    .update({
      direction: input.direction,
      category: input.category,
      amount: input.amount,
      ref_number: input.ref_number,
      counterparty_name: input.counterparty_name ?? null,
      counterparty_number: input.counterparty_number ?? null,
      fee_computed: input.fee_computed,
      status: input.status,
      notes: input.notes ?? null,
    })
    .eq("id", transactionId)
    .eq("store_id", storeId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/ledger");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
