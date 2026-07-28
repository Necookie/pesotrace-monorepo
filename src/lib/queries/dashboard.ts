import { cache } from "react";
import type { Database, TransactionCategory } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORY_LABELS } from "@/lib/schemas/transaction";
import { storeToday, previousDayKey, recentDayKeys, formatDayKeyShort } from "@/lib/time";

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

export type DailyIncomePoint = { day: string; label: string; income: number; count: number };

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
  // Income earned today (Manila) and its change vs. yesterday, for the
  // day-to-day figure an owner checks against the cash drawer. Uses
  // store-local days, unlike the UTC-bucketed feeTrend above.
  todayIncome: number;
  todayIncomeDelta: PeriodDelta;
  dailyIncome: DailyIncomePoint[];
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

type IncomeRow = Pick<DashboardRow, "occurred_at" | "fee_computed">;

/**
 * Today's income, its change vs. yesterday, and the last 7 days as a
 * zero-filled series. Pure so it can be tested without a database — the `now`
 * argument is injectable for exactly that reason.
 *
 * occurred_at holds the receipt's Manila wall-clock time stored under a UTC
 * label (e.g. 7:00 PM -> "...T19:00:00Z"), NOT a true instant. So a row's day
 * is the date already written in the value — a raw slice — and must NOT be run
 * through storeDayKey, which would re-convert it to Manila and push evening
 * transactions into the next day. That over-conversion was undercounting
 * "today" here versus the income-trend chart, which slices the same way. (This
 * is the opposite of admin analytics, whose created_at values ARE true
 * instants and correctly use storeDayKey.)
 */
export function dailyIncomeFromRows(
  rows: IncomeRow[],
  now: Date = new Date()
): { todayIncome: number; todayIncomeDelta: PeriodDelta; dailyIncome: DailyIncomePoint[] } {
  const byDay = new Map<string, { income: number; count: number }>();
  for (const r of rows) {
    const key = r.occurred_at.slice(0, 10);
    const entry = byDay.get(key) ?? { income: 0, count: 0 };
    entry.income += Number(r.fee_computed);
    entry.count += 1;
    byDay.set(key, entry);
  }

  const dailyIncome: DailyIncomePoint[] = recentDayKeys(7, now).map((day) => ({
    day,
    label: formatDayKeyShort(day),
    income: byDay.get(day)?.income ?? 0,
    count: byDay.get(day)?.count ?? 0,
  }));

  const todayKey = storeToday(now);
  const todayIncome = byDay.get(todayKey)?.income ?? 0;
  const yesterdayIncome = byDay.get(previousDayKey(todayKey))?.income ?? 0;

  return { todayIncome, todayIncomeDelta: periodDelta(todayIncome, yesterdayIncome), dailyIncome };
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

  const { todayIncome, todayIncomeDelta, dailyIncome } = dailyIncomeFromRows(rows, now);

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
    todayIncome,
    todayIncomeDelta,
    dailyIncome,
    deltas: {
      totalVolume: periodDelta(current.totalVolume, previous.totalVolume),
      transactionCount: periodDelta(current.transactionCount, previous.transactionCount),
      feesEarned: periodDelta(current.feesEarned, previous.feesEarned),
      avgSize: periodDelta(current.avgSize, previous.avgSize),
    },
  };
});
