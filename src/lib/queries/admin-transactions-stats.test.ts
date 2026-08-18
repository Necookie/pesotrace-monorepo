import { describe, it, expect } from "vitest";
import { computeAdminTransactionStats } from "./admin-transactions-stats";

describe("computeAdminTransactionStats", () => {
  it("handles empty transactions array gracefully", () => {
    const stats = computeAdminTransactionStats([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.totalVolume).toBe(0);
    expect(stats.totalFees).toBe(0);
    expect(stats.avgAmount).toBe(0);
    expect(stats.confirmedRatePct).toBe(100);
    expect(stats.volumeTrend).toEqual([]);
    expect(stats.byCategory.cash_in.count).toBe(0);
    expect(stats.byDirection.sendCount).toBe(0);
  });

  it("accurately calculates totals, directions, categories, and trends", () => {
    const sample = [
      {
        id: "tx-1",
        direction: "send" as const,
        category: "cash_out" as const,
        amount: 1000,
        fee_computed: 15,
        status: "confirmed" as const,
        source_type: "screenshot" as const,
        occurred_at: "2026-08-18T08:30:00Z",
      },
      {
        id: "tx-2",
        direction: "receive" as const,
        category: "cash_in" as const,
        amount: 2500,
        fee_computed: 30,
        status: "confirmed" as const,
        source_type: "statement" as const,
        occurred_at: "2026-08-18T09:15:00Z",
      },
      {
        id: "tx-3",
        direction: "send" as const,
        category: "bills" as const,
        amount: 500,
        fee_computed: 10,
        status: "needs_review" as const,
        source_type: "manual" as const,
        occurred_at: "2026-08-17T14:00:00Z",
      },
    ];

    const stats = computeAdminTransactionStats(sample);

    expect(stats.totalCount).toBe(3);
    expect(stats.totalVolume).toBe(4000);
    expect(stats.totalFees).toBe(55);
    expect(stats.avgAmount).toBeCloseTo(1333.33, 1);
    expect(stats.confirmedCount).toBe(2);
    expect(stats.needsReviewCount).toBe(1);
    expect(stats.confirmedRatePct).toBe(66.7);

    // Direction
    expect(stats.byDirection.sendCount).toBe(2);
    expect(stats.byDirection.sendVolume).toBe(1500);
    expect(stats.byDirection.receiveCount).toBe(1);
    expect(stats.byDirection.receiveVolume).toBe(2500);

    // Category
    expect(stats.byCategory.cash_out.count).toBe(1);
    expect(stats.byCategory.cash_out.volume).toBe(1000);
    expect(stats.byCategory.cash_in.count).toBe(1);
    expect(stats.byCategory.cash_in.volume).toBe(2500);
    expect(stats.byCategory.bills.count).toBe(1);
    expect(stats.byCategory.bills.volume).toBe(500);
    expect(stats.byCategory.load.count).toBe(0);

    // Source
    expect(stats.bySourceType.screenshot.count).toBe(1);
    expect(stats.bySourceType.statement.count).toBe(1);
    expect(stats.bySourceType.manual.count).toBe(1);

    // Trend
    expect(stats.volumeTrend.length).toBe(2);
  });
});
