import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionCategory } from "@/lib/database.types";

export type TransactionFilters = {
  direction?: "send" | "receive";
  category?: TransactionCategory;
  status?: "needs_review" | "confirmed";
  search?: string;
  from?: string;
  to?: string;
};

export type TransactionListPage = {
  rows: Database["public"]["Tables"]["transactions"]["Row"][];
  hasMore: boolean;
};

export async function listTransactions(
  supabase: SupabaseClient<Database>,
  storeId: string,
  filters: TransactionFilters = {},
  limit = 500,
  offset = 0
): Promise<TransactionListPage> {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("store_id", storeId)
    .order("occurred_at", { ascending: false });

  if (filters.direction) query = query.eq("direction", filters.direction);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("occurred_at", filters.from);
  if (filters.to) query = query.lte("occurred_at", filters.to);
  if (filters.search) {
    // PostgREST's or() filter syntax treats ",()" as structural — a raw search
    // term containing them (e.g. "dela Cruz, Juan") would corrupt the filter
    // or let it bleed into an unintended clause. Escape wildcards + structural
    // chars per PostgREST's own escaping rules before interpolating.
    const escaped = filters.search.replace(/[%,()]/g, (c) => `\\${c}`);
    query = query.or(
      `ref_number.ilike.%${escaped}%,counterparty_name.ilike.%${escaped}%,counterparty_number.ilike.%${escaped}%`
    );
  }

  // Fetch one extra row past the page limit to know whether there's a next
  // page, without a separate count(*) query.
  const { data, error } = await query.range(offset, offset + limit);
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

import { auth } from "@clerk/nextjs/server";

export async function getCurrentStoreId(supabase: SupabaseClient<Database>) {
  const { userId } = await auth();
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("store_id")
    .eq("id", userId)
    .single();

  return data?.store_id ?? null;
}
