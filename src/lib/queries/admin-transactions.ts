import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  AdminTransactionFilterParams,
  AdminTransactionRow,
  AdminTransactionStats,
} from "@/lib/queries/admin-types";
import { resolveAdminDateRange } from "@/lib/admin-filters";
import { computeAdminTransactionStats } from "@/lib/queries/admin-transactions-stats";

export type AdminTransactionsResult = {
  transactions: AdminTransactionRow[];
  totalCount: number;
  stats: AdminTransactionStats;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listAdminTransactions(
  supabase: SupabaseClient<Database>,
  params: AdminTransactionFilterParams
): Promise<AdminTransactionsResult> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 25));
  const offset = (page - 1) * pageSize;
  const sortBy = params.sortBy || "occurred_at";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";

  const { startIso, endIso } = resolveAdminDateRange(
    params.dateRange,
    params.startDate,
    params.endDate
  );

  // 1. Build Query for Paginated Rows
  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" });

  if (params.q) {
    const trimmed = params.q.trim();
    const escaped = trimmed.replace(/[%,()]/g, (c) => `\\${c}`);
    query = query.or(
      `ref_number.ilike.%${escaped}%,counterparty_name.ilike.%${escaped}%,counterparty_number.ilike.%${escaped}%,notes.ilike.%${escaped}%`
    );
  }

  if (params.storeId) {
    query = query.eq("store_id", params.storeId);
  }

  if (params.createdBy) {
    query = query.eq("created_by", params.createdBy);
  }

  if (params.direction) {
    query = query.eq("direction", params.direction);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.sourceType) {
    query = query.eq("source_type", params.sourceType);
  }

  if (startIso) {
    query = query.gte("occurred_at", startIso);
  }

  if (endIso) {
    query = query.lte("occurred_at", endIso);
  }

  if (params.minAmount !== undefined) {
    query = query.gte("amount", params.minAmount);
  }

  if (params.maxAmount !== undefined) {
    query = query.lte("amount", params.maxAmount);
  }

  // 2. Build Query for Aggregation Stats across all filtered rows (up to a performant window)
  let statsQuery = supabase
    .from("transactions")
    .select("id, direction, category, amount, fee_computed, status, source_type, occurred_at")
    .limit(2000);

  if (params.q) {
    const trimmed = params.q.trim();
    const escaped = trimmed.replace(/[%,()]/g, (c) => `\\${c}`);
    statsQuery = statsQuery.or(
      `ref_number.ilike.%${escaped}%,counterparty_name.ilike.%${escaped}%,counterparty_number.ilike.%${escaped}%,notes.ilike.%${escaped}%`
    );
  }
  if (params.storeId) statsQuery = statsQuery.eq("store_id", params.storeId);
  if (params.createdBy) statsQuery = statsQuery.eq("created_by", params.createdBy);
  if (params.direction) statsQuery = statsQuery.eq("direction", params.direction);
  if (params.category) statsQuery = statsQuery.eq("category", params.category);
  if (params.status) statsQuery = statsQuery.eq("status", params.status);
  if (params.sourceType) statsQuery = statsQuery.eq("source_type", params.sourceType);
  if (startIso) statsQuery = statsQuery.gte("occurred_at", startIso);
  if (endIso) statsQuery = statsQuery.lte("occurred_at", endIso);
  if (params.minAmount !== undefined) statsQuery = statsQuery.gte("amount", params.minAmount);
  if (params.maxAmount !== undefined) statsQuery = statsQuery.lte("amount", params.maxAmount);

  // Execute both queries concurrently
  const [paginatedRes, statsRes] = await Promise.all([
    query
      .order(sortBy, { ascending: sortDir === "asc" })
      .range(offset, offset + pageSize - 1),
    statsQuery,
  ]);

  if (paginatedRes.error) throw paginatedRes.error;
  if (statsRes.error) throw statsRes.error;

  const rawRows = paginatedRes.data ?? [];
  const totalCount = paginatedRes.count ?? 0;
  const statsRows = statsRes.data ?? [];
  const stats = computeAdminTransactionStats(statsRows);

  // If total count is greater than stats sample, preserve exact totalCount in stats
  if (totalCount > stats.totalCount && stats.totalCount > 0) {
    // Keep exact totalCount
    stats.totalCount = totalCount;
  }

  // 3. Batch resolve Store Names & Creator Names
  const storeIds = [...new Set(rawRows.map((r) => r.store_id))];
  const creatorIds = [...new Set(rawRows.map((r) => r.created_by).filter((id): id is string => Boolean(id)))];

  const [{ data: stores }, { data: profiles }] = await Promise.all([
    storeIds.length > 0
      ? supabase.from("stores").select("id, name").in("id", storeIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length > 0
      ? supabase.from("profiles").select("id, full_name").in("id", creatorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const storeNameMap = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const profileNameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  // 4. Batch sign receipt URLs
  const filePaths = rawRows
    .map((r) => r.source_file_url)
    .filter((p): p is string => Boolean(p));

  const signedByPath = new Map<string, string>();
  if (filePaths.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from("transaction-sources")
      .createSignedUrls(filePaths, 60 * 60);
    for (const item of signedUrls ?? []) {
      if (item.signedUrl && item.path) {
        signedByPath.set(item.path, item.signedUrl);
      }
    }
  }

  const transactions: AdminTransactionRow[] = rawRows.map((t) => ({
    id: t.id,
    storeId: t.store_id,
    storeName: storeNameMap.get(t.store_id) ?? "Unknown store",
    direction: t.direction,
    category: t.category,
    amount: Number(t.amount) || 0,
    refNumber: t.ref_number,
    counterpartyNumber: t.counterparty_number,
    counterpartyName: t.counterparty_name,
    occurredAt: t.occurred_at,
    status: t.status,
    feeComputed: Number(t.fee_computed) || 0,
    sourceType: t.source_type,
    sourceFileUrl: t.source_file_url,
    confidence: t.confidence,
    notes: t.notes,
    tags: t.tags ?? [],
    createdBy: t.created_by,
    creatorName: t.created_by ? (profileNameMap.get(t.created_by) ?? "Staff") : null,
    createdAt: t.created_at,
    receiptUrl: t.source_file_url ? (signedByPath.get(t.source_file_url) ?? null) : null,
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    transactions,
    totalCount,
    stats,
    page,
    pageSize,
    totalPages,
  };
}
