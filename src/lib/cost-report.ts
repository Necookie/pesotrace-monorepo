import {
  storeDayKey,
  storeWeekKey,
  storeMonthKey,
  storeToday,
  previousDayKey,
  previousWeekKey,
  previousMonthKey,
  recentDayKeys,
  recentWeekKeys,
  recentMonthKeys,
  formatDayKeyShort,
  formatWeekKeyShort,
  formatMonthKeyShort,
} from "@/lib/time";
import { escapeCsv } from "@/lib/csv";

/** The subset of a credit_ledger row that cost reporting reads. */
export type LedgerCostEntry = {
  created_at: string;
  cost_usd: number;
  credit_delta: number;
};

export type PeriodTotals = { costUsd: number; credits: number; requests: number };

export type PeriodStat = PeriodTotals & { key: string; label: string };

export type CostReport = {
  daily: PeriodStat[];
  weekly: PeriodStat[];
  monthly: PeriodStat[];
  today: PeriodTotals;
  yesterday: PeriodTotals;
  thisWeek: PeriodTotals;
  lastWeek: PeriodTotals;
  thisMonth: PeriodTotals;
  lastMonth: PeriodTotals;
};

const DAILY_WINDOW = 30;
const WEEKLY_WINDOW = 12;
const MONTHLY_WINDOW = 12;

function zeroTotals(): PeriodTotals {
  return { costUsd: 0, credits: 0, requests: 0 };
}

function bump(map: Map<string, PeriodTotals>, key: string, costUsd: number, credits: number) {
  const existing = map.get(key) ?? zeroTotals();
  existing.costUsd += costUsd;
  existing.credits += credits;
  existing.requests += 1;
  map.set(key, existing);
}

/**
 * Buckets consumption ledger entries into daily/weekly/monthly cost + usage
 * series (Manila calendar), plus current-vs-prior-period totals for
 * today/yesterday, this/last week, and this/last month — the raw material
 * for the admin cost-report panels. Pure and independent of the query layer
 * so it's cheap to unit-test against fixture rows.
 */
export function buildCostReport(entries: LedgerCostEntry[], now: Date = new Date()): CostReport {
  const byDay = new Map<string, PeriodTotals>();
  const byWeek = new Map<string, PeriodTotals>();
  const byMonth = new Map<string, PeriodTotals>();

  for (const entry of entries) {
    const credits = Math.abs(entry.credit_delta);
    bump(byDay, storeDayKey(entry.created_at), entry.cost_usd, credits);
    bump(byWeek, storeWeekKey(entry.created_at), entry.cost_usd, credits);
    bump(byMonth, storeMonthKey(entry.created_at), entry.cost_usd, credits);
  }

  const daily = recentDayKeys(DAILY_WINDOW, now).map((key) => ({
    key,
    label: formatDayKeyShort(key),
    ...(byDay.get(key) ?? zeroTotals()),
  }));
  const weekly = recentWeekKeys(WEEKLY_WINDOW, now).map((key) => ({
    key,
    label: formatWeekKeyShort(key),
    ...(byWeek.get(key) ?? zeroTotals()),
  }));
  const monthly = recentMonthKeys(MONTHLY_WINDOW, now).map((key) => ({
    key,
    label: formatMonthKeyShort(key),
    ...(byMonth.get(key) ?? zeroTotals()),
  }));

  const todayKey = storeToday(now);
  const yesterdayKey = previousDayKey(todayKey);
  const thisWeekKey = storeWeekKey(now);
  const lastWeekKey = previousWeekKey(thisWeekKey);
  const thisMonthKey = storeMonthKey(now);
  const lastMonthKey = previousMonthKey(thisMonthKey);

  return {
    daily,
    weekly,
    monthly,
    today: byDay.get(todayKey) ?? zeroTotals(),
    yesterday: byDay.get(yesterdayKey) ?? zeroTotals(),
    thisWeek: byWeek.get(thisWeekKey) ?? zeroTotals(),
    lastWeek: byWeek.get(lastWeekKey) ?? zeroTotals(),
    thisMonth: byMonth.get(thisMonthKey) ?? zeroTotals(),
    lastMonth: byMonth.get(lastMonthKey) ?? zeroTotals(),
  };
}

/** Renders a daily/weekly/monthly PeriodStat series as a downloadable CSV, oldest first. */
export function periodStatsToCsv(stats: PeriodStat[], periodLabel: string): string {
  const header = [periodLabel, "Requests", "Credits", "Cost (USD)"];
  const lines = stats.map((s) =>
    [s.label, s.requests, s.credits, s.costUsd.toFixed(6)].map(escapeCsv).join(",")
  );
  return "\uFEFF" + [header.join(","), ...lines].join("\n");
}
