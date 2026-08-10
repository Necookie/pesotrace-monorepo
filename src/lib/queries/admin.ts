import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CreditEntryType, TransactionSource, AdminActionType, Json } from "@/lib/database.types";
import type { CreditUsagePoint } from "@/components/charts/credit-usage-chart";
import { formatDate } from "@/lib/format";
import { summarizeFeeConfig, type FeeConfigSummary } from "@/lib/fees";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";
import { storeDayKey, storeToday, recentDayKeys } from "@/lib/time";
import { buildCostReport, type CostReport } from "@/lib/cost-report";
import { isUsageAnomaly } from "@/lib/usage-anomaly";

const LEDGER_HISTORY_LIMIT = 25;
const ANALYTICS_WINDOW_DAYS = 30;
// Covers the 12-month trailing window buildCostReport generates, plus slack
// for the current partial month.
const COST_REPORT_WINDOW_DAYS = 380;

export type StoreAnalytics = {
  requestsToday: number;
  requestsThisWeek: number;
};

export type StoreExtractionFailures = {
  storeId: string;
  storeName: string;
  failureCount: number;
  totalExtractions: number;
  /** Percentage of extractions that failed, 0–100 rounded to 1 decimal place. */
  failureRatePct: number;
  wastedCostUsd: number;
};

/**
 * Stores with failed extractions in the last 7 days, worst first. A failed
 * extraction still bills Gemini but charges the store 0 credits (see
 * consume_credit's p_credits: 0 path in extract/route.ts) — that's the only
 * signal a failure leaves in the ledger, since the actual error text isn't
 * persisted anywhere. Surfacing the pattern (not the message) still catches
 * a bad prompt or a systemic API issue before it becomes a pile of tickets.
 *
 * Also fetches total extractions per affected store so the panel can display
 * a failure rate percentage rather than just a raw count.
 */
export async function listRecentExtractionFailures(
  supabase: SupabaseClient<Database>,
  days = FAILURE_WINDOW_DAYS
): Promise<StoreExtractionFailures[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: entries, error } = await supabase
    .from("credit_ledger")
    .select("store_id, cost_usd, credit_delta")
    .eq("entry_type", "consumption")
    .gte("created_at", since);

  if (error) throw error;
  if (!entries || entries.length === 0) return [];

  const byStore = new Map<string, { failureCount: number; totalExtractions: number; wastedCostUsd: number }>();
  for (const entry of entries) {
    const existing = byStore.get(entry.store_id) ?? { failureCount: 0, totalExtractions: 0, wastedCostUsd: 0 };
    existing.totalExtractions += 1;
    if (entry.credit_delta === 0 && entry.cost_usd > 0) {
      existing.failureCount += 1;
      existing.wastedCostUsd += entry.cost_usd;
    }
    byStore.set(entry.store_id, existing);
  }

  // Only surface stores that actually have failures.
  const failingStoreIds = [...byStore.entries()]
    .filter(([, stats]) => stats.failureCount > 0)
    .map(([storeId]) => storeId);

  if (failingStoreIds.length === 0) return [];

  const { data: stores, error: storesError } = await supabase.from("stores").select("id, name").in("id", failingStoreIds);
  if (storesError) throw storesError;
  const nameByStoreId = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return failingStoreIds
    .map((storeId) => {
      const stats = byStore.get(storeId)!;
      return {
        storeId,
        storeName: nameByStoreId.get(storeId) ?? "Deleted store",
        failureCount: stats.failureCount,
        totalExtractions: stats.totalExtractions,
        failureRatePct: stats.totalExtractions > 0
          ? Math.round((stats.failureCount / stats.totalExtractions) * 1000) / 10
          : 0,
        wastedCostUsd: stats.wastedCostUsd,
      };
    })
    .sort((a, b) => b.failureCount - a.failureCount);
}

/**
 * Date-ranged aggregation, independent of the LEDGER_HISTORY_LIMIT used for
 * the ledger history table — a high-volume store's last 200 ledger rows
 * (of any entry type) can span far less than 30 days, which would silently
 * truncate "today"/"this week" counts if derived from that same query.
 *
 * Daily/weekly/monthly series live in getStoreCostReport now — this stays
 * scoped to the two KPI-tile totals the store detail page still needs.
 */
export async function getStoreAnalytics(
  supabase: SupabaseClient<Database>,
  storeId: string,
  days = ANALYTICS_WINDOW_DAYS
): Promise<StoreAnalytics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: entries, error } = await supabase
    .from("credit_ledger")
    .select("created_at")
    .eq("store_id", storeId)
    .eq("entry_type", "consumption")
    .gte("created_at", since);

  if (error) throw error;

  const countByDay = new Map<string, number>();
  for (const entry of entries ?? []) {
    const key = storeDayKey(entry.created_at);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  const todayKey = storeToday();
  const weekAgoKey = storeDayKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const requestsToday = countByDay.get(todayKey) ?? 0;
  const requestsThisWeek = [...countByDay.entries()]
    .filter(([day]) => day >= weekAgoKey)
    .reduce((sum, [, count]) => sum + count, 0);

  return { requestsToday, requestsThisWeek };
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
  /** Total rows matching the current entry-type filter, for page numbers. */
  ledgerTotal: number;
  requestsToday: number;
  requestsThisWeek: number;
};

export async function getStoreCreditDetail(
  supabase: SupabaseClient<Database>,
  storeId: string,
  ledgerOffset = 0,
  entryType?: CreditEntryType
): Promise<AdminStoreDetail | null> {
  let ledgerQuery = supabase
    .from("credit_ledger")
    .select("id, entry_type, credit_delta, cost_usd, source_type, note, created_by, created_at", {
      count: "exact",
    })
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (entryType) ledgerQuery = ledgerQuery.eq("entry_type", entryType);

  const [
    { data: store, error: storeError },
    { data: credit, error: creditError },
    { data: ledgerPage, error: ledgerError, count: ledgerCount },
    analytics,
  ] = await Promise.all([
    supabase.from("stores").select("id, name").eq("id", storeId).maybeSingle(),
    supabase.from("store_credits").select("balance").eq("store_id", storeId).maybeSingle(),
    ledgerQuery.range(ledgerOffset, ledgerOffset + LEDGER_HISTORY_LIMIT - 1),
    getStoreAnalytics(supabase, storeId),
  ]);

  if (storeError) throw storeError;
  if (creditError) throw creditError;
  if (ledgerError) throw ledgerError;
  if (!store) return null;

  return {
    storeId: store.id,
    storeName: store.name,
    balance: credit?.balance ?? 0,
    ledger: (ledgerPage ?? []).map((entry) => ({
      id: entry.id,
      entryType: entry.entry_type,
      creditDelta: entry.credit_delta,
      costUsd: entry.cost_usd,
      sourceType: entry.source_type,
      note: entry.note,
      createdBy: entry.created_by,
      createdAt: entry.created_at,
    })),
    ledgerTotal: ledgerCount ?? 0,
    requestsToday: analytics.requestsToday,
    requestsThisWeek: analytics.requestsThisWeek,
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
  /**
   * The store's own fee setup, summarized. Carried on the overview row so an
   * operator can spot a misconfigured or still-default schedule while scanning
   * the list, instead of opening each store to find out.
   */
  feeConfig: FeeConfigSummary;
  suspended: boolean;
  /**
   * True when today's request count is a significant spike (>= 3x) over the
   * store's trailing 7-day average — a shared/abused API key looks like
   * this just as often as a great sales day does, so it's a "look at this"
   * flag, not an accusation.
   */
  usageAnomaly: boolean;
};


export async function listStoresWithCredits(
  supabase: SupabaseClient<Database>
): Promise<AdminStoreRow[]> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: stores, error: storesError },
    { data: credits, error: creditsError },
    { data: recentLedger, error: ledgerError },
  ] = await Promise.all([
    supabase.from("stores").select("id, name, fee_tier_config, fee_formula, suspended").order("name"),
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

  const todayKey = storeToday();

  const usageByStore = new Map<
    string,
    {
      extractions: number;
      costUsd: number;
      requestsToday: number;
      lastActivityAt: string;
      byDay: Map<string, number>;
      requestsByDay: Map<string, number>;
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
        requestsByDay: new Map(),
      };
      usageByStore.set(entry.store_id, existing);
    }
    existing.extractions += 1;
    existing.costUsd += entry.cost_usd;
    if (entry.created_at > existing.lastActivityAt) existing.lastActivityAt = entry.created_at;

    const key = storeDayKey(entry.created_at);
    if (key === todayKey) existing.requestsToday += 1;
    existing.byDay.set(key, (existing.byDay.get(key) ?? 0) + Math.abs(entry.credit_delta));
    existing.requestsByDay.set(key, (existing.requestsByDay.get(key) ?? 0) + 1);
  }

  // The 7 days immediately before today, for isUsageAnomaly's trailing-average baseline.
  const priorWeekKeys = recentDayKeys(8, new Date()).slice(0, 7);

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
      feeConfig: summarizeFeeConfig({
        tiers: store.fee_tier_config ?? DEFAULT_FEE_TIER_CONFIG,
        formula: store.fee_formula,
      }),
      suspended: store.suspended,
      usageAnomaly: usage
        ? isUsageAnomaly(
            usage.requestsToday,
            priorWeekKeys.map((key) => usage.requestsByDay.get(key) ?? 0)
          )
        : false,
    };
  });
}

/**
 * Total credit consumption across every store, by day — the single trend
 * line an operator scans first to see whether platform-wide usage is
 * growing, flat, or dropping, without adding up 30 per-store sparklines
 * themselves.
 */
export type PlatformOverviewTrends = {
  /** % change in total extractions: current 7d vs prior 7d */
  extractionsTrend: number | null;
  /** % change in platform real cost: current 7d vs prior 7d */
  costTrend: number | null;
  /** Count of stores that had at least one extraction this month */
  activeStoreCount: number;
};

/**
 * Computes percentage-delta trends for the admin overview KPI tiles by
 * comparing the current 7-day window to the prior 7-day window. Derived
 * from the same ledger query as listStoresWithCredits but kept separate so
 * the overview page can call it independently without re-reading all stores.
 */
export async function getPlatformOverviewTrends(
  supabase: SupabaseClient<Database>
): Promise<PlatformOverviewTrends> {
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: ledger14d }, { data: ledger30d }] = await Promise.all([
    supabase
      .from("credit_ledger")
      .select("store_id, cost_usd, created_at")
      .eq("entry_type", "consumption")
      .gte("created_at", since14d),
    supabase
      .from("credit_ledger")
      .select("store_id")
      .eq("entry_type", "consumption")
      .gte("created_at", since30d),
  ]);

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let currentExtractions = 0;
  let priorExtractions = 0;
  let currentCost = 0;
  let priorCost = 0;

  for (const entry of ledger14d ?? []) {
    if (entry.created_at >= since7d) {
      currentExtractions += 1;
      currentCost += entry.cost_usd;
    } else {
      priorExtractions += 1;
      priorCost += entry.cost_usd;
    }
  }

  function pctDelta(current: number, prior: number): number | null {
    if (prior <= 0) return null;
    return ((current - prior) / prior) * 100;
  }

  const activeStoreIds = new Set((ledger30d ?? []).map((e) => e.store_id));

  return {
    extractionsTrend: pctDelta(currentExtractions, priorExtractions),
    costTrend: pctDelta(currentCost, priorCost),
    activeStoreCount: activeStoreIds.size,
  };
}

export type CreditBalancePoint = {
  label: string;
  balance: number;
};

/**
 * Reconstructs the credit balance at end-of-day for each of the past 30 days
 * by replaying all ledger entries (any type) in chronological order. This gives
 * operators a quick visual of whether a store has been steadily consuming or is
 * sitting on an idle balance — useful context before adjusting credits.
 */
export async function getStoreCreditBalanceHistory(
  supabase: SupabaseClient<Database>,
  storeId: string,
  days = 30
): Promise<CreditBalancePoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: ledger }, { data: credit }] = await Promise.all([
    supabase
      .from("credit_ledger")
      .select("credit_delta, created_at")
      .eq("store_id", storeId)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase.from("store_credits").select("balance").eq("store_id", storeId).maybeSingle(),
  ]);

  const currentBalance = credit?.balance ?? 0;
  const entries = ledger ?? [];

  // Walk backwards from current balance to reconstruct historical balances.
  // The running total at any point is current balance minus all deltas after that point.
  const deltaAfterDay = new Map<string, number>();
  for (const entry of entries) {
    const key = storeDayKey(entry.created_at);
    deltaAfterDay.set(key, (deltaAfterDay.get(key) ?? 0) + entry.credit_delta);
  }

  const allDays = recentDayKeys(days, new Date());
  const points: CreditBalancePoint[] = [];
  let runningBalance = currentBalance;

  // Iterate newest to oldest, subtracting each day's net delta to get the balance at end-of-previous-day.
  for (let i = 0; i < allDays.length; i++) {
    const key = allDays[i];
    points.unshift({ label: formatDate(key), balance: Math.max(0, runningBalance) });
    runningBalance -= deltaAfterDay.get(key) ?? 0;
  }

  return points;
}

/**
 * Daily/weekly/monthly cost report for one store — the per-store analytics
 * ask (usage stats, daily/weekly/monthly cost). Fetches a wide-enough window
 * in one query and lets buildCostReport do all the bucketing.
 */
export async function getStoreCostReport(
  supabase: SupabaseClient<Database>,
  storeId: string
): Promise<CostReport> {
  const since = new Date(Date.now() - COST_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("created_at, cost_usd, credit_delta")
    .eq("store_id", storeId)
    .eq("entry_type", "consumption")
    .gte("created_at", since);

  if (error) throw error;
  return buildCostReport(data ?? []);
}

/** Same report, aggregated across every store — the platform-wide view on the overview page. */
export async function getPlatformCostReport(supabase: SupabaseClient<Database>): Promise<CostReport> {
  const since = new Date(Date.now() - COST_REPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("credit_ledger")
    .select("created_at, cost_usd, credit_delta")
    .eq("entry_type", "consumption")
    .gte("created_at", since);

  if (error) throw error;
  return buildCostReport(data ?? []);
}

/**
 * Returns the number of user profiles belonging to a store. Useful for an
 * operator to understand whether a store has any active staff beyond the
 * owner — a single-user store vs. a busy multi-operator setup changes how
 * aggressively you'd cut their credits.
 */
export async function getStoreMemberCount(
  supabase: SupabaseClient<Database>,
  storeId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);

  if (error) throw error;
  return count ?? 0;
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

export type FeeConfigChange = {
  id: string;
  actorUserId: string;
  targetSummary: string | null;
  previousTiers: Json;
  previousFormula: string | null;
  newTiers: Json;
  newFormula: string | null;
  createdAt: string;
};

/**
 * Fee-setup edits for one store, newest first.
 *
 * "My fees changed and I don't know why" is a support question that is
 * otherwise unanswerable — the stores row only holds the current value. Note
 * this covers admin-side edits only: owners changing their own fees in
 * settings do not write to the admin audit log.
 */
export async function listStoreFeeChanges(
  supabase: SupabaseClient<Database>,
  storeId: string,
  limit = 20
): Promise<FeeConfigChange[]> {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, actor_user_id, target_summary, metadata, created_at")
    .eq("store_id", storeId)
    .eq("action", "update_fee_tiers")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((entry) => {
    const meta = (entry.metadata ?? {}) as Record<string, Json>;
    return {
      id: entry.id,
      actorUserId: entry.actor_user_id,
      targetSummary: entry.target_summary,
      previousTiers: meta.previousTiers ?? null,
      previousFormula: (meta.previousFormula as string | null) ?? null,
      newTiers: meta.newTiers ?? null,
      newFormula: (meta.newFormula as string | null) ?? null,
      createdAt: entry.created_at,
    };
  });
}

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

export type StoreReceiptRow = {
  transaction: Database["public"]["Tables"]["transactions"]["Row"];
  /** Signed URL to the uploaded receipt, or null for statement/manual rows. */
  receiptUrl: string | null;
};

/**
 * A store's transactions paired with a signed URL to the receipt each was
 * extracted from, for an operator to verify the parsed fields against the
 * original image. Uses the admin (service-role) client, so it reads across
 * stores — callers must already be gated to platform operators.
 *
 * Receipt URLs are signed in one batch rather than per row, and given a
 * generous expiry so an operator can open a full-size image in a new tab
 * minutes after the page loaded.
 */
export async function getStoreTransactionsWithReceipts(
  supabase: SupabaseClient<Database>,
  storeId: string,
  limit = 20,
  offset = 0
): Promise<{ rows: StoreReceiptRow[]; hasMore: boolean }> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("store_id", storeId)
    .order("occurred_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) throw error;

  const fetched = data ?? [];
  const hasMore = fetched.length > limit;
  const page = hasMore ? fetched.slice(0, limit) : fetched;

  const paths = page
    .map((t) => t.source_file_url)
    .filter((p): p is string => Boolean(p));

  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("transaction-sources")
      .createSignedUrls(paths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) signedByPath.set(item.path, item.signedUrl);
    }
  }

  return {
    rows: page.map((transaction) => ({
      transaction,
      receiptUrl: transaction.source_file_url
        ? signedByPath.get(transaction.source_file_url) ?? null
        : null,
    })),
    hasMore,
  };
}

const CROSS_STORE_SEARCH_LIMIT = 50;

export type CrossStoreSearchResult = {
  transaction: Database["public"]["Tables"]["transactions"]["Row"];
  storeId: string;
  storeName: string;
};

/**
 * Finds a transaction across every store by reference number or
 * counterparty — the per-store search on the store detail page can't help
 * when a customer dispute comes in without knowing which store it belongs
 * to. Uses the admin (service-role) client, so it deliberately reads across
 * tenants; callers must already be gated to platform operators.
 */
export async function searchTransactionsAcrossStores(
  supabase: SupabaseClient<Database>,
  query: string,
  limit = CROSS_STORE_SEARCH_LIMIT
): Promise<CrossStoreSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Same PostgREST or() escaping as listTransactions' search filter.
  const escaped = trimmed.replace(/[%,()]/g, (c) => `\\${c}`);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .or(
      `ref_number.ilike.%${escaped}%,counterparty_name.ilike.%${escaped}%,counterparty_number.ilike.%${escaped}%`
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!transactions || transactions.length === 0) return [];

  const storeIds = [...new Set(transactions.map((t) => t.store_id))];
  const { data: stores, error: storesError } = await supabase.from("stores").select("id, name").in("id", storeIds);
  if (storesError) throw storesError;

  const nameByStoreId = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return transactions.map((transaction) => ({
    transaction,
    storeId: transaction.store_id,
    storeName: nameByStoreId.get(transaction.store_id) ?? "Deleted store",
  }));
}

const FAILURE_WINDOW_DAYS = 7;

export type StoreExtractionFailures = {
  storeId: string;
  storeName: string;
  failureCount: number;
  wastedCostUsd: number;
};

/**
 * Stores with failed extractions in the last 7 days, worst first. A failed
 * extraction still bills Gemini but charges the store 0 credits (see
 * consume_credit's p_credits: 0 path in extract/route.ts) — that's the only
 * signal a failure leaves in the ledger, since the actual error text isn't
 * persisted anywhere. Surfacing the pattern (not the message) still catches
 * a bad prompt or a systemic API issue before it becomes a pile of tickets.
 */
export async function listRecentExtractionFailures(
  supabase: SupabaseClient<Database>,
  days = FAILURE_WINDOW_DAYS
): Promise<StoreExtractionFailures[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: entries, error } = await supabase
    .from("credit_ledger")
    .select("store_id, cost_usd")
    .eq("entry_type", "consumption")
    .eq("credit_delta", 0)
    .gt("cost_usd", 0)
    .gte("created_at", since);

  if (error) throw error;
  if (!entries || entries.length === 0) return [];

  const byStore = new Map<string, { failureCount: number; wastedCostUsd: number }>();
  for (const entry of entries) {
    const existing = byStore.get(entry.store_id) ?? { failureCount: 0, wastedCostUsd: 0 };
    existing.failureCount += 1;
    existing.wastedCostUsd += entry.cost_usd;
    byStore.set(entry.store_id, existing);
  }

  const storeIds = [...byStore.keys()];
  const { data: stores, error: storesError } = await supabase.from("stores").select("id, name").in("id", storeIds);
  if (storesError) throw storesError;
  const nameByStoreId = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return [...byStore.entries()]
    .map(([storeId, stats]) => ({
      storeId,
      storeName: nameByStoreId.get(storeId) ?? "Deleted store",
      ...stats,
    }))
    .sort((a, b) => b.failureCount - a.failureCount);
}

const DEFAULT_LOW_BALANCE_THRESHOLD = 10;

export type PlatformSettings = {
  lowBalanceThreshold: number;
  /** Pre-fill amount for trial credit grants — operator-configured, overrideable per request. */
  defaultGrantAmount: number;
  updatedAt: string;
  updatedBy: string | null;
};

/**
 * The one operational setting today: the credit balance at or below which
 * the low-balance cron sweep notifies a store. Falls back to the historical
 * hardcoded value if the singleton row is ever missing (it's seeded by
 * migration 0018 and never deleted, but the fallback keeps the cron from
 * hard-failing on a schema hiccup rather than just skipping a threshold).
 */
export async function getPlatformSettings(supabase: SupabaseClient<Database>): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("low_balance_threshold, updated_at, updated_by")
    .eq("id", true)
    .maybeSingle();

  if (error) throw error;

  return {
    lowBalanceThreshold: data?.low_balance_threshold ?? DEFAULT_LOW_BALANCE_THRESHOLD,
    defaultGrantAmount: (data as Record<string, unknown> | null)?.default_grant_amount as number | undefined ?? 50,
    updatedAt: data?.updated_at ?? new Date(0).toISOString(),
    updatedBy: data?.updated_by ?? null,
  };
}
