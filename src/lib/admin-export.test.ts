import { describe, it, expect } from "vitest";
import { generateStoresCsv } from "./admin-export";
import type { AdminStoreRow } from "./queries/admin";

describe("generateStoresCsv", () => {
  const mockStores: AdminStoreRow[] = [
    {
      storeId: "store-123",
      storeName: 'Sari-Sari "Super" Store',
      balance: 150,
      requestsToday: 12,
      extractionsThisMonth: 85,
      costUsdThisMonth: 0.0425,
      lastActivityAt: "2026-08-16T12:00:00Z",
      suspended: false,
      dailyUsage: [],
      feeConfig: {
        mode: "tiered",
        summaryText: "Tiered",
        isCustom: false,
      },
    },
    {
      storeId: "store-456",
      storeName: "Bakery & Cafe",
      balance: 0,
      requestsToday: 0,
      extractionsThisMonth: 0,
      costUsdThisMonth: 0,
      lastActivityAt: null,
      suspended: true,
      dailyUsage: [],
      feeConfig: {
        mode: "fixed",
        summaryText: "Fixed P10",
        isCustom: true,
      },
    },
  ];

  it("generates correct header row with all required columns", () => {
    const csv = generateStoresCsv(mockStores);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      '"Store Name","Store ID","Health Status","Account Status","Credit Balance","Requests Today","Extractions (30d)","Real Cost USD (30d)","Last Activity"'
    );
  });

  it("properly escapes double quotes in store names", () => {
    const csv = generateStoresCsv(mockStores);
    const lines = csv.split("\n");
    expect(lines[1]).toContain('"Sari-Sari ""Super"" Store"');
  });

  it("evaluates health status and account status correctly", () => {
    const csv = generateStoresCsv(mockStores);
    const lines = csv.split("\n");
    // store-123 is active and healthy
    expect(lines[1]).toContain('"Healthy"');
    expect(lines[1]).toContain('"Active"');

    // store-456 is suspended
    expect(lines[2]).toContain('"Suspended"');
    expect(lines[2]).toContain('"Never"');
  });
});
