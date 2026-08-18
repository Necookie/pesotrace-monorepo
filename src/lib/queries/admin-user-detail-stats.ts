import type {
  TransactionCategory,
  TransactionSource,
  ProfileRole,
} from "@/lib/database.types";
import type { AdminUserDetailData, AdminTransactionRow } from "@/lib/queries/admin-types";
import { storeDayKey, formatDayKeyShort } from "@/lib/time";

const ALL_CATEGORIES: TransactionCategory[] = ["cash_in", "cash_out", "load", "bills", "other"];
const ALL_SOURCES: TransactionSource[] = ["screenshot", "statement", "manual"];

export function computeUserDetailStats({
  user,
  transactions,
  ledgerEntries,
}: {
  user: {
    id: string;
    fullName: string | null;
    role: ProfileRole;
    storeId: string;
    storeName: string;
    isPlatformAdmin: boolean;
    createdAt: string;
  };
  transactions: AdminTransactionRow[];
  ledgerEntries: {
    id: string;
    entryType: any;
    creditDelta: number;
    costUsd: number;
    sourceType: TransactionSource | null;
    note: string | null;
    createdAt: string;
  }[];
}): AdminUserDetailData {
  let totalVolume = 0;
  let totalFees = 0;
  let confirmedCount = 0;
  let needsReviewCount = 0;
  let lastActiveAt: string | null = null;

  const byDirection = {
    sendCount: 0,
    sendVolume: 0,
    receiveCount: 0,
    receiveVolume: 0,
  };

  const byCategory = ALL_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = { count: 0, volume: 0 };
      return acc;
    },
    {} as Record<TransactionCategory, { count: number; volume: number }>
  );

  const bySourceType = ALL_SOURCES.reduce(
    (acc, src) => {
      acc[src] = { count: 0, volume: 0 };
      return acc;
    },
    {} as Record<TransactionSource, { count: number; volume: number }>
  );

  const dailyMap = new Map<string, { volume: number; count: number }>();

  for (const t of transactions) {
    totalVolume += t.amount;
    totalFees += t.feeComputed;

    if (t.status === "confirmed") {
      confirmedCount += 1;
    } else {
      needsReviewCount += 1;
    }

    if (t.direction === "send") {
      byDirection.sendCount += 1;
      byDirection.sendVolume += t.amount;
    } else {
      byDirection.receiveCount += 1;
      byDirection.receiveVolume += t.amount;
    }

    const cat = t.category || "other";
    if (byCategory[cat]) {
      byCategory[cat].count += 1;
      byCategory[cat].volume += t.amount;
    }

    const src = t.sourceType || "manual";
    if (bySourceType[src]) {
      bySourceType[src].count += 1;
      bySourceType[src].volume += t.amount;
    }

    const day = storeDayKey(t.occurredAt);
    const existing = dailyMap.get(day) ?? { volume: 0, count: 0 };
    existing.volume += t.amount;
    existing.count += 1;
    dailyMap.set(day, existing);

    const tDate = t.occurredAt || t.createdAt;
    if (!lastActiveAt || tDate > lastActiveAt) {
      lastActiveAt = tDate;
    }
  }

  let totalCreditsUsed = 0;
  let totalCostUsd = 0;
  for (const ledg of ledgerEntries) {
    totalCreditsUsed += Math.abs(ledg.creditDelta || 0);
    totalCostUsd += ledg.costUsd || 0;
    if (!lastActiveAt || ledg.createdAt > lastActiveAt) {
      lastActiveAt = ledg.createdAt;
    }
  }

  const totalCount = transactions.length;
  const avgAmount = totalCount > 0 ? totalVolume / totalCount : 0;
  const confirmedRatePct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 1000) / 10 : 100;

  const activityTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      label: formatDayKeyShort(date),
      volume: data.volume,
      count: data.count,
    }));

  return {
    user,
    stats: {
      totalTransactions: totalCount,
      totalVolume,
      totalFees,
      avgAmount,
      confirmedCount,
      needsReviewCount,
      confirmedRatePct,
      lastActiveAt,
      extractionsCount: ledgerEntries.length,
      creditsUsed: totalCreditsUsed,
      costUsd: totalCostUsd,
    },
    byCategory,
    byDirection,
    bySourceType,
    activityTrend,
    recentTransactions: transactions.slice(0, 50),
    recentExtractions: ledgerEntries.slice(0, 50),
  };
}
