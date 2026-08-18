import type { Database, TransactionCategory, TransactionSource } from "@/lib/database.types";
import type { AdminTransactionStats } from "@/lib/queries/admin-types";
import { storeDayKey, formatDayKeyShort } from "@/lib/time";

type TransactionRowMinimal = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  "id" | "direction" | "category" | "amount" | "fee_computed" | "status" | "source_type" | "occurred_at"
>;

const ALL_CATEGORIES: TransactionCategory[] = ["cash_in", "cash_out", "load", "bills", "other"];
const ALL_SOURCES: TransactionSource[] = ["screenshot", "statement", "manual"];

export function computeAdminTransactionStats(
  transactions: TransactionRowMinimal[]
): AdminTransactionStats {
  let totalVolume = 0;
  let totalFees = 0;
  let confirmedCount = 0;
  let needsReviewCount = 0;

  const byDirection = {
    sendCount: 0,
    sendVolume: 0,
    receiveCount: 0,
    receiveVolume: 0,
  };

  const byCategory = ALL_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = { count: 0, volume: 0, fee: 0 };
      return acc;
    },
    {} as Record<TransactionCategory, { count: number; volume: number; fee: number }>
  );

  const bySourceType = ALL_SOURCES.reduce(
    (acc, src) => {
      acc[src] = { count: 0, volume: 0 };
      return acc;
    },
    {} as Record<TransactionSource, { count: number; volume: number }>
  );

  const dailyMap = new Map<string, { volume: number; count: number; fee: number }>();

  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    const fee = Number(t.fee_computed) || 0;

    totalVolume += amount;
    totalFees += fee;

    if (t.status === "confirmed") {
      confirmedCount += 1;
    } else {
      needsReviewCount += 1;
    }

    if (t.direction === "send") {
      byDirection.sendCount += 1;
      byDirection.sendVolume += amount;
    } else {
      byDirection.receiveCount += 1;
      byDirection.receiveVolume += amount;
    }

    const cat = t.category || "other";
    if (byCategory[cat]) {
      byCategory[cat].count += 1;
      byCategory[cat].volume += amount;
      byCategory[cat].fee += fee;
    }

    const src = t.source_type || "manual";
    if (bySourceType[src]) {
      bySourceType[src].count += 1;
      bySourceType[src].volume += amount;
    }

    const day = storeDayKey(t.occurred_at);
    const existingDay = dailyMap.get(day) ?? { volume: 0, count: 0, fee: 0 };
    existingDay.volume += amount;
    existingDay.count += 1;
    existingDay.fee += fee;
    dailyMap.set(day, existingDay);
  }

  const totalCount = transactions.length;
  const avgAmount = totalCount > 0 ? totalVolume / totalCount : 0;
  const confirmedRatePct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 1000) / 10 : 100;

  const volumeTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      label: formatDayKeyShort(date),
      volume: data.volume,
      count: data.count,
      fee: data.fee,
    }));

  return {
    totalCount,
    totalVolume,
    totalFees,
    avgAmount,
    confirmedCount,
    needsReviewCount,
    confirmedRatePct,
    byDirection,
    byCategory,
    bySourceType,
    volumeTrend,
  };
}
