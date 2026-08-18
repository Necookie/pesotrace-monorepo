import { describe, it, expect } from "vitest";
import { generateAdminUsersCsv } from "./admin-user-export";
import type { AdminUserRow } from "@/lib/queries/admin-types";

describe("generateAdminUsersCsv", () => {
  it("formats user headers and rows correctly", () => {
    const sample: AdminUserRow[] = [
      {
        userId: "user-1",
        fullName: "Juan Dela Cruz",
        role: "owner",
        storeId: "store-1",
        storeName: "Main Store",
        isPlatformAdmin: true,
        createdAt: "2026-08-01T00:00:00Z",
        totalTransactionsCreated: 15,
        totalVolumeProcessed: 45000,
        totalFeesGenerated: 450,
        lastActiveAt: "2026-08-18T10:00:00Z",
        extractionsConsumed: 10,
        creditsConsumed: 20,
      },
    ];

    const csv = generateAdminUsersCsv(sample);
    const lines = csv.split("\n");

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("User ID");
    expect(lines[0]).toContain("Full Name");
    expect(lines[1]).toContain("user-1");
    expect(lines[1]).toContain("Juan Dela Cruz");
    expect(lines[1]).toContain("45000.00");
    expect(lines[1]).toContain("Yes");
  });
});
