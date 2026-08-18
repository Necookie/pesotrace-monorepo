import { describe, it, expect } from "vitest";
import { generateAdminTransactionsCsv } from "./admin-transaction-export";
import type { AdminTransactionRow } from "@/lib/queries/admin-types";

describe("generateAdminTransactionsCsv", () => {
  it("formats headers and rows correctly escaping special characters", () => {
    const sample: AdminTransactionRow[] = [
      {
        id: "tx-1",
        storeId: "store-1",
        storeName: 'Sari-Sari "Best" Store',
        direction: "send",
        category: "cash_in",
        amount: 1500,
        refNumber: "REF123456",
        counterpartyNumber: "09171234567",
        counterpartyName: "Juan Dela Cruz",
        occurredAt: "2026-08-18T10:00:00Z",
        status: "confirmed",
        feeComputed: 20,
        sourceType: "screenshot",
        sourceFileUrl: null,
        confidence: 0.95,
        notes: "Paid via GCash, verified",
        tags: [],
        createdBy: "user-1",
        creatorName: "Maria Santos",
        createdAt: "2026-08-18T10:01:00Z",
        receiptUrl: null,
      },
    ];

    const csv = generateAdminTransactionsCsv(sample);
    const lines = csv.split("\n");

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("Transaction ID");
    expect(lines[0]).toContain("Store Name");
    expect(lines[1]).toContain('""Best""'); // escaped quotes
    expect(lines[1]).toContain("1500.00");
    expect(lines[1]).toContain("20.00");
    expect(lines[1]).toContain("95%");
    expect(lines[1]).toContain("Maria Santos");
  });
});
