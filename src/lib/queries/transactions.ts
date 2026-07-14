import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type TransactionFilters = {
  direction?: "send" | "receive";
  status?: "needs_review" | "confirmed";
  search?: string;
  from?: string;
  to?: string;
};

export async function listTransactions(
  supabase: SupabaseClient<Database>,
  storeId: string,
  filters: TransactionFilters = {}
) {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("store_id", storeId)
    .order("occurred_at", { ascending: false });

  if (filters.direction) query = query.eq("direction", filters.direction);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("occurred_at", filters.from);
  if (filters.to) query = query.lte("occurred_at", filters.to);
  if (filters.search) {
    query = query.or(
      `ref_number.ilike.%${filters.search}%,counterparty_name.ilike.%${filters.search}%,counterparty_number.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query.limit(500);
  if (error) throw error;
  return data;
}

export async function getCurrentStoreId(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", user.id)
    .single();

  return data?.store_id ?? null;
}
