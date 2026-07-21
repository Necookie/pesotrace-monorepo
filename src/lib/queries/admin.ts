import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type AdminStoreRow = {
  storeId: string;
  storeName: string;
  balance: number;
};

export async function listStoresWithCredits(
  supabase: SupabaseClient<Database>
): Promise<AdminStoreRow[]> {
  const [{ data: stores, error: storesError }, { data: credits, error: creditsError }] =
    await Promise.all([
      supabase.from("stores").select("id, name").order("name"),
      supabase.from("store_credits").select("store_id, balance"),
    ]);

  if (storesError) throw storesError;
  if (creditsError) throw creditsError;

  const balanceByStore = new Map((credits ?? []).map((c) => [c.store_id, c.balance]));

  return (stores ?? []).map((store) => ({
    storeId: store.id,
    storeName: store.name,
    balance: balanceByStore.get(store.id) ?? 0,
  }));
}
