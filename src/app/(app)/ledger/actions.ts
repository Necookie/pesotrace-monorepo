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
