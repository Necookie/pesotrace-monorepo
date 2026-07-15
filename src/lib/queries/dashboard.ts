import { cache } from "react";
import type { Database, TransactionCategory } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORY_LABELS } from "@/lib/schemas/transaction";

const DASHBOARD_COLUMNS =
  "amount, direction, category, status, occurred_at, counterparty_name, counterparty_number, fee_computed" as const;

type DashboardRow = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  | "amount"
  | "direction"
  | "category"
  | "status"
  | "occurred_at"
  | "counterparty_name"
  | "counterparty_number"
  | "fee_computed"
>;

export type PeriodDelta = { current: number; previous: number; pct: number | null };

export type DashboardStats = {
  totalVolume: number;
  transactionCount: number;
  feesEarned: number;
  avgSize: number;
  needsReviewCount: number;
  topCounterparties: { name: string; amount: number }[];
  trend: { label: string; send: number; receive: number }[];
  feeTrend: { label: string; fee: number }[];
  categoryTotals: { category: TransactionCategory; label: string; amount: number }[];
  statusBreakdown: { confirmed: number; needsReview: number };
  deltas: {
    totalVolume: PeriodDelta;
    transactionCount: PeriodDelta;
    feesEarned: PeriodDelta;
    avgSize: PeriodDelta;
  };
};

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function periodDelta(current: number, previous: number): PeriodDelta {
  const pct = previous > 0 ? ((current - previous) / previous) * 100 : null;
  return { current, previous, pct };
}

function summarize(rows: DashboardRow[]) {
  const totalVolume = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const feesEarned = rows.reduce((sum, r) => sum + Number(r.fee_computed), 0);
  return {
    totalVolume,
    transactionCount: rows.length,
    feesEarned,
    avgSize: rows.length > 0 ? totalVolume / rows.length : 0,
  };
}

export const getDashboardStats = cache(async function getDashboardStats(
  supabase: SupabaseClient<Database>,
  storeId: string
): Promise<DashboardStats> {
  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 30);
  const prevSince = new Date(now);
  prevSince.setDate(prevSince.getDate() - 60);

  // One 60-day fetch covers both the current and prior 30-day windows, so
  // computing period-over-period deltas doesn't cost a second round trip.
  const { data, error } = await supabase
    .from("transactions")
    .select(DASHBOARD_COLUMNS)
    .eq("store_id", storeId)
    .gte("occurred_at", prevSince.toISOString());

  if (error) throw error;
  const allRows: DashboardRow[] = data ?? [];

  const sinceIso = since.toISOString();
  const rows = allRows.filter((r) => r.occurred_at >= sinceIso);
  const previousRows = allRows.filter((r) => r.occurred_at < sinceIso);

  const current = summarize(rows);
  const previous = summarize(previousRows);
  const needsReviewCount = rows.filter((r) => r.status === "needs_review").length;

  const counterpartyTotals = new Map<string, number>();
  for (const r of rows) {
    const name = r.counterparty_name || r.counterparty_number || "Unknown";
    counterpartyTotals.set(name, (counterpartyTotals.get(name) ?? 0) + Number(r.amount));
  }
  const topCounterparties = [...counterpartyTotals.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const byDay = new Map<string, { send: number; receive: number; fee: number }>();
  for (const r of rows) {
    const key = dayKey(r.occurred_at);
    const entry = byDay.get(key) ?? { send: 0, receive: 0, fee: 0 };
    if (r.direction === "send") entry.send += Number(r.amount);
    else entry.receive += Number(r.amount);
    entry.fee += Number(r.fee_computed);
    byDay.set(key, entry);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const trend = days.map(([label, v]) => ({ label, send: v.send, receive: v.receive }));
  const feeTrend = days.map(([label, v]) => ({ label, fee: v.fee }));

  const categoryAmounts = new Map<TransactionCategory, number>();
  for (const r of rows) {
    categoryAmounts.set(r.category, (categoryAmounts.get(r.category) ?? 0) + Number(r.amount));
  }
  const categoryTotals = (Object.keys(CATEGORY_LABELS) as TransactionCategory[]).map(
    (category) => ({
      category,
      label: CATEGORY_LABELS[category],
      amount: categoryAmounts.get(category) ?? 0,
    })
  );

  const statusBreakdown = {
    confirmed: rows.length - needsReviewCount,
    needsReview: needsReviewCount,
  };

  return {
    totalVolume: current.totalVolume,
    transactionCount: current.transactionCount,
    feesEarned: current.feesEarned,
    avgSize: current.avgSize,
    needsReviewCount,
    topCounterparties,
    trend,
    feeTrend,
    categoryTotals,
    statusBreakdown,
    deltas: {
      totalVolume: periodDelta(current.totalVolume, previous.totalVolume),
      transactionCount: periodDelta(current.transactionCount, previous.transactionCount),
      feesEarned: periodDelta(current.feesEarned, previous.feesEarned),
      avgSize: periodDelta(current.avgSize, previous.avgSize),
    },
  };
});
