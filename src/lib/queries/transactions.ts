import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionCategory } from "@/lib/database.types";
import { paginateRows } from "@/lib/pagination";

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
  /** Total matching rows across all pages (respects filters), for page numbers. */
  total: number;
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
    .select("*", { count: "exact" })
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

  // Fetch one extra row past the page limit to derive hasMore cheaply; the
  // exact count drives the numbered page controls.
  const { data, error, count } = await query.range(offset, offset + limit);
  if (error) throw error;

  return { ...paginateRows(data ?? [], limit), total: count ?? 0 };
}

// The reports page loads up to 5,000 rows so its client-side date picker can
// range over history without refetching. Serializing full rows into the RSC
// payload meant shipping ~18 columns each — including notes, source_file_url
// and tags — when ReportBuilder only reads these four.
const REPORT_COLUMNS = "occurred_at, amount, direction, category" as const;

export type ReportRow = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  "occurred_at" | "amount" | "direction" | "category"
>;

export async function listTransactionsForReport(
  supabase: SupabaseClient<Database>,
  storeId: string,
  limit = 5000
): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(REPORT_COLUMNS)
    .eq("store_id", storeId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

import { getStoreContext } from "@/lib/queries/store-context";

// Delegates to the request-cached store context, so the ~20 call sites here
// plus the (app) layout's nav lookup all collapse into a single profiles
// round trip per request instead of one each.
export async function getCurrentStoreId() {
  return (await getStoreContext()).storeId;
}
