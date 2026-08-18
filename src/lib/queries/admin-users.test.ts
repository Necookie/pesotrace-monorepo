import { describe, it, expect } from "vitest";
import { buildAdminUsersData } from "./admin-users-stats";

describe("buildAdminUsersData", () => {
  it("aggregates users, transactions, and ledger credits accurately", () => {
    const fixedNow = new Date("2026-08-18T12:00:00Z");

    const profiles = [
      {
        id: "user-1",
        full_name: "Alice Owner",
        role: "owner" as const,
        store_id: "store-1",
        created_at: "2026-08-01T00:00:00Z",
      },
      {
        id: "user-2",
        full_name: "Bob Staff",
        role: "staff" as const,
        store_id: "store-1",
        created_at: "2026-08-05T00:00:00Z",
      },
    ];

    const stores = [{ id: "store-1", name: "Flagship Sari-Sari" }];
    const platformAdmins = [{ user_id: "user-1" }];
    const transactions = [
      {
        created_by: "user-2",
        amount: 5000,
        fee_computed: 50,
        occurred_at: "2026-08-18T10:00:00Z",
        created_at: "2026-08-18T10:00:00Z",
      },
    ];
    const ledgerEntries = [
      {
        created_by: "user-2",
        credit_delta: -2,
        cost_usd: 0.005,
        entry_type: "consumption" as const,
        created_at: "2026-08-18T10:00:00Z",
      },
    ];

    const { users, stats } = buildAdminUsersData({
      profiles,
      stores,
      platformAdmins,
      transactions,
      ledgerEntries,
      now: fixedNow,
    });

    expect(users.length).toBe(2);
    expect(stats.totalUsers).toBe(2);
    expect(stats.totalOwners).toBe(1);
    expect(stats.totalStaff).toBe(1);
    expect(stats.totalPlatformAdmins).toBe(1);
    expect(stats.topUsersByVolume.length).toBe(1);
    expect(stats.topUsersByVolume[0].userId).toBe("user-2");
    expect(stats.topUsersByVolume[0].volume).toBe(5000);

    const user2 = users.find((u) => u.userId === "user-2");
    expect(user2).toBeDefined();
    expect(user2?.totalTransactionsCreated).toBe(1);
    expect(user2?.totalVolumeProcessed).toBe(5000);
    expect(user2?.totalFeesGenerated).toBe(50);
    expect(user2?.creditsConsumed).toBe(2);
    expect(user2?.extractionsConsumed).toBe(1);
  });
});
