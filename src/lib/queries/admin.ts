import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CreditEntryType, TransactionSource, AdminActionType, Json } from "@/lib/database.types";
import type { CreditUsagePoint } from "@/components/charts/credit-usage-chart";
import type { RequestVolumePoint } from "@/components/charts/request-volume-chart";
import { formatDate } from "@/lib/format";

const LEDGER_HISTORY_LIMIT = 200;
const ANALYTICS_WINDOW_DAYS = 30;

export type StoreAnalytics = {
  requestsToday: number;
  requestsThisWeek: number;
  dailyRequestCounts: RequestVolumePoint[];
  dailyCreditUsage: CreditUsagePoint[];
};

/**
 * Date-ranged aggregation, independent of the LEDGER_HISTORY_LIMIT used for
 * the ledger history table — a high-volume store's last 200 ledger rows
 * (of any entry type) can span far less than 30 days, which would silently
 * truncate "today"/"this week" counts if derived from that same query.
 */
export async function getStoreAnalytics(
  supabase: SupabaseClient<Database>,
  storeId: string,
  days = ANALYTICS_WINDOW_DAYS
): Promise<StoreAnalytics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: entries, error } = await supabase
    .from("credit_ledger")
    .select("credit_delta, created_at")
    .eq("store_id", storeId)
    .eq("entry_type", "consumption")
    .gte("created_at", since);

  if (error) throw error;

  const countByDay = new Map<string, number>();
  const creditsByDay = new Map<string, number>();
  for (const entry of entries ?? []) {
    const key = dayKey(entry.created_at);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    creditsByDay.set(key, (creditsByDay.get(key) ?? 0) + Math.abs(entry.credit_delta));
  }

  const todayKey = dayKey(new Date().toISOString());
  const weekAgoKey = dayKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString());

  const requestsToday = countByDay.get(todayKey) ?? 0;
  const requestsThisWeek = [...countByDay.entries()]
    .filter(([day]) => day >= weekAgoKey)
    .reduce((sum, [, count]) => sum + count, 0);

  const dailyRequestCounts: RequestVolumePoint[] = [...countByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ label: formatDate(day), count }));

  const dailyCreditUsage: CreditUsagePoint[] = [...creditsByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, credits]) => ({ label: formatDate(day), credits }));

  return { requestsToday, requestsThisWeek, dailyRequestCounts, dailyCreditUsage };
}

export type CreditLedgerEntry = {
  id: string;
  entryType: CreditEntryType;
  creditDelta: number;
  costUsd: number;
  sourceType: TransactionSource | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type AdminStoreDetail = {
  storeId: string;
  storeName: string;
  balance: number;
  ledger: CreditLedgerEntry[];
  ledgerHasMore: boolean;
  requestsToday: number;
  requestsThisWeek: number;
  dailyRequestCounts: RequestVolumePoint[];
  dailyUsage: CreditUsagePoint[];
};

export async function getStoreCreditDetail(
  supabase: SupabaseClient<Database>,
  storeId: string,
  ledgerOffset = 0
): Promise<AdminStoreDetail | null> {
  const [
    { data: store, error: storeError },
    { data: credit, error: creditError },
    { data: ledgerPage, error: ledgerError },
    analytics,
  ] = await Promise.all([
    supabase.from("stores").select("id, name").eq("id", storeId).maybeSingle(),
    supabase.from("store_credits").select("balance").eq("store_id", storeId).maybeSingle(),
    supabase
      .from("credit_ledger")
      .select("id, entry_type, credit_delta, cost_usd, source_type, note, created_by, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      // Fetch one extra row past the page to know if there's a next page,
      // without a separate count(*) query.
      .range(ledgerOffset, ledgerOffset + LEDGER_HISTORY_LIMIT),
    getStoreAnalytics(supabase, storeId),
  ]);

  if (storeError) throw storeError;
  if (creditError) throw creditError;
  if (ledgerError) throw ledgerError;
  if (!store) return null;

  const ledgerRows = ledgerPage ?? [];
  const ledgerHasMore = ledgerRows.length > LEDGER_HISTORY_LIMIT;
  const ledger = ledgerHasMore ? ledgerRows.slice(0, LEDGER_HISTORY_LIMIT) : ledgerRows;

  return {
    storeId: store.id,
    storeName: store.name,
    balance: credit?.balance ?? 0,
    ledger: ledger.map((entry) => ({
      id: entry.id,
      entryType: entry.entry_type,
      creditDelta: entry.credit_delta,
      costUsd: entry.cost_usd,
      sourceType: entry.source_type,
      note: entry.note,
      createdBy: entry.created_by,
      createdAt: entry.created_at,
    })),
    ledgerHasMore,
    requestsToday: analytics.requestsToday,
    requestsThisWeek: analytics.requestsThisWeek,
    dailyRequestCounts: analytics.dailyRequestCounts,
    dailyUsage: analytics.dailyCreditUsage,
  };
}

export type AdminStoreRow = {
  storeId: string;
  storeName: string;
  balance: number;
  extractionsThisMonth: number;
  costUsdThisMonth: number;
  requestsToday: number;
  lastActivityAt: string | null;
  dailyUsage: CreditUsagePoint[];
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export async function listStoresWithCredits(
  supabase: SupabaseClient<Database>
): Promise<AdminStoreRow[]> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: stores, error: storesError },
    { data: credits, error: creditsError },
    { data: recentLedger, error: ledgerError },
  ] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    supabase.from("store_credits").select("store_id, balance"),
    supabase
      .from("credit_ledger")
      .select("store_id, entry_type, credit_delta, cost_usd, created_at")
      .eq("entry_type", "consumption")
      .gte("created_at", since30d),
  ]);

  if (storesError) throw storesError;
  if (creditsError) throw creditsError;
  if (ledgerError) throw ledgerError;

  const balanceByStore = new Map((credits ?? []).map((c) => [c.store_id, c.balance]));

  const todayKey = dayKey(new Date().toISOString());

  const usageByStore = new Map<
    string,
    {
      extractions: number;
      costUsd: number;
      requestsToday: number;
      lastActivityAt: string;
      byDay: Map<string, number>;
    }
  >();
  for (const entry of recentLedger ?? []) {
    let existing = usageByStore.get(entry.store_id);
    if (!existing) {
      existing = {
        extractions: 0,
        costUsd: 0,
        requestsToday: 0,
        lastActivityAt: entry.created_at,
        byDay: new Map(),
      };
      usageByStore.set(entry.store_id, existing);
    }
    existing.extractions += 1;
    existing.costUsd += entry.cost_usd;
    if (entry.created_at > existing.lastActivityAt) existing.lastActivityAt = entry.created_at;

    const key = dayKey(entry.created_at);
    if (key === todayKey) existing.requestsToday += 1;
    existing.byDay.set(key, (existing.byDay.get(key) ?? 0) + Math.abs(entry.credit_delta));
  }

  return (stores ?? []).map((store) => {
    const usage = usageByStore.get(store.id);
    const dailyUsage: CreditUsagePoint[] = usage
      ? [...usage.byDay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, creditsUsed]) => ({ label: formatDate(day), credits: creditsUsed }))
      : [];

    return {
      storeId: store.id,
      storeName: store.name,
      requestsToday: usage?.requestsToday ?? 0,
      balance: balanceByStore.get(store.id) ?? 0,
      extractionsThisMonth: usage?.extractions ?? 0,
      costUsdThisMonth: usage?.costUsd ?? 0,
      lastActivityAt: usage?.lastActivityAt ?? null,
      dailyUsage,
    };
  });
}

export type PendingCreditRequest = {
  id: string;
  storeId: string;
  storeName: string;
  requestedBy: string | null;
  createdAt: string;
};

export async function listPendingCreditRequests(
  supabase: SupabaseClient<Database>
): Promise<PendingCreditRequest[]> {
  const { data: requests, error: requestsError } = await supabase
    .from("credit_requests")
    .select("id, store_id, requested_by, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (requestsError) throw requestsError;
  if (!requests || requests.length === 0) return [];

  const storeIds = [...new Set(requests.map((r) => r.store_id))];
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("id, name")
    .in("id", storeIds);

  if (storesError) throw storesError;
  const nameByStoreId = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return requests.map((r) => ({
    id: r.id,
    storeId: r.store_id,
    storeName: nameByStoreId.get(r.store_id) ?? "Unknown store",
    requestedBy: r.requested_by,
    createdAt: r.created_at,
  }));
}

const AUDIT_LOG_LIMIT = 200;

export type AdminAuditLogEntry = {
  id: string;
  actorUserId: string;
  action: AdminActionType;
  storeId: string | null;
  storeName: string | null;
  targetSummary: string | null;
  metadata: Json;
  createdAt: string;
};

export async function listAuditLog(
  supabase: SupabaseClient<Database>,
  limit = AUDIT_LOG_LIMIT
): Promise<AdminAuditLogEntry[]> {
  const { data: entries, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_user_id, action, store_id, target_summary, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!entries || entries.length === 0) return [];

  const storeIds = [...new Set(entries.map((e) => e.store_id).filter((id): id is string => id !== null))];
  let nameByStoreId = new Map<string, string>();
  if (storeIds.length > 0) {
    const { data: stores, error: storesError } = await supabase.from("stores").select("id, name").in("id", storeIds);
    if (storesError) throw storesError;
    nameByStoreId = new Map((stores ?? []).map((s) => [s.id, s.name]));
  }

  return entries.map((e) => ({
    id: e.id,
    actorUserId: e.actor_user_id,
    action: e.action,
    storeId: e.store_id,
    storeName: e.store_id ? (nameByStoreId.get(e.store_id) ?? "Deleted store") : null,
    targetSummary: e.target_summary,
    metadata: e.metadata,
    createdAt: e.created_at,
  }));
}
