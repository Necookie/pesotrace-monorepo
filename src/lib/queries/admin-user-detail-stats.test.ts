import { describe, it, expect } from "vitest";
import { computeUserDetailStats } from "./admin-user-detail-stats";
import type { AdminTransactionRow } from "@/lib/queries/admin-types";

describe("computeUserDetailStats", () => {
  it("calculates per-user totals, accuracy, and categories correctly", () => {
    const user = {
      id: "usr-456",
      fullName: "Maria Clara",
      role: "manager" as const,
      storeId: "str-789",
      storeName: "Clara Retail",
      isPlatformAdmin: false,
      createdAt: "2026-07-01T00:00:00Z",
    };

    const transactions: AdminTransactionRow[] = [
      {
        id: "tx-1",
        storeId: "str-789",
        storeName: "Clara Retail",
        direction: "send",
        category: "cash_out",
        amount: 3000,
        refNumber: "REF111",
        counterpartyNumber: "09180000000",
        counterpartyName: "Pedro",
        occurredAt: "2026-08-18T10:00:00Z",
        status: "confirmed",
        feeComputed: 35,
        sourceType: "screenshot",
        sourceFileUrl: null,
        confidence: 0.99,
        notes: null,
        tags: [],
        createdBy: "usr-456",
        creatorName: "Maria Clara",
        createdAt: "2026-08-18T10:00:00Z",
        receiptUrl: null,
      },
      {
        id: "tx-2",
        storeId: "str-789",
        storeName: "Clara Retail",
        direction: "receive",
        category: "cash_in",
        amount: 2000,
        refNumber: "REF222",
        counterpartyNumber: null,
        counterpartyName: null,
        occurredAt: "2026-08-18T11:00:00Z",
        status: "needs_review",
        feeComputed: 20,
        sourceType: "manual",
        sourceFileUrl: null,
        confidence: null,
        notes: null,
        tags: [],
        createdBy: "usr-456",
        creatorName: "Maria Clara",
        createdAt: "2026-08-18T11:00:00Z",
        receiptUrl: null,
      },
    ];

    const ledgerEntries = [
      {
        id: "led-1",
        entryType: "consumption" as const,
        creditDelta: -1,
        costUsd: 0.003,
        sourceType: "screenshot" as const,
        note: null,
        createdAt: "2026-08-18T10:00:00Z",
      },
    ];

    const result = computeUserDetailStats({ user, transactions, ledgerEntries });

    expect(result.user.id).toBe("usr-456");
    expect(result.stats.totalTransactions).toBe(2);
    expect(result.stats.totalVolume).toBe(5000);
    expect(result.stats.totalFees).toBe(55);
    expect(result.stats.confirmedCount).toBe(1);
    expect(result.stats.needsReviewCount).toBe(1);
    expect(result.stats.confirmedRatePct).toBe(50);
    expect(result.stats.creditsUsed).toBe(1);
    expect(result.stats.costUsd).toBe(0.003);

    expect(result.byDirection.sendVolume).toBe(3000);
    expect(result.byDirection.receiveVolume).toBe(2000);
    expect(result.byCategory.cash_out.volume).toBe(3000);
    expect(result.byCategory.cash_in.volume).toBe(2000);
    expect(result.bySourceType.screenshot.count).toBe(1);
    expect(result.bySourceType.manual.count).toBe(1);
  });
});
