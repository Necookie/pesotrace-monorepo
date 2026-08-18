import type { Database } from "@/lib/database.types";
import type { AdminUserRow, AdminUserStats } from "@/lib/queries/admin-types";

export type RawProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type RawStore = Pick<Database["public"]["Tables"]["stores"]["Row"], "id" | "name">;
export type RawAdmin = { user_id: string };
export type RawTx = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  "created_by" | "amount" | "fee_computed" | "occurred_at" | "created_at"
>;
export type RawLedger = Pick<
  Database["public"]["Tables"]["credit_ledger"]["Row"],
  "created_by" | "credit_delta" | "cost_usd" | "entry_type" | "created_at"
>;

export function buildAdminUsersData({
  profiles,
  stores,
  platformAdmins,
  transactions,
  ledgerEntries,
  now = new Date(),
}: {
  profiles: RawProfile[];
  stores: RawStore[];
  platformAdmins: RawAdmin[];
  transactions: RawTx[];
  ledgerEntries: RawLedger[];
  now?: Date;
}): { users: AdminUserRow[]; stats: AdminUserStats } {
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const storeMap = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const adminSet = new Set((platformAdmins ?? []).map((a) => a.user_id));

  // User transaction aggregations
  type UserTxAgg = {
    txCount: number;
    volume: number;
    fees: number;
    lastTxAt: string | null;
  };
  const txByUser = new Map<string, UserTxAgg>();
  for (const t of transactions ?? []) {
    if (!t.created_by) continue;
    const existing = txByUser.get(t.created_by) ?? {
      txCount: 0,
      volume: 0,
      fees: 0,
      lastTxAt: null,
    };
    existing.txCount += 1;
    existing.volume += Number(t.amount) || 0;
    existing.fees += Number(t.fee_computed) || 0;

    const tDate = t.occurred_at || t.created_at;
    if (!existing.lastTxAt || tDate > existing.lastTxAt) {
      existing.lastTxAt = tDate;
    }
    txByUser.set(t.created_by, existing);
  }

  // User credit ledger aggregations
  type UserLedgerAgg = {
    extractions: number;
    creditsUsed: number;
    lastLedgerAt: string | null;
  };
  const ledgerByUser = new Map<string, UserLedgerAgg>();
  for (const entry of ledgerEntries ?? []) {
    if (!entry.created_by) continue;
    const existing = ledgerByUser.get(entry.created_by) ?? {
      extractions: 0,
      creditsUsed: 0,
      lastLedgerAt: null,
    };
    existing.extractions += 1;
    existing.creditsUsed += Math.abs(entry.credit_delta || 0);
    if (!existing.lastLedgerAt || entry.created_at > existing.lastLedgerAt) {
      existing.lastLedgerAt = entry.created_at;
    }
    ledgerByUser.set(entry.created_by, existing);
  }

  // Build full user rows
  const users: AdminUserRow[] = (profiles ?? []).map((p) => {
    const tx = txByUser.get(p.id);
    const ledg = ledgerByUser.get(p.id);

    let lastActiveAt: string | null = null;
    if (tx?.lastTxAt && ledg?.lastLedgerAt) {
      lastActiveAt = tx.lastTxAt > ledg.lastLedgerAt ? tx.lastTxAt : ledg.lastLedgerAt;
    } else {
      lastActiveAt = tx?.lastTxAt ?? ledg?.lastLedgerAt ?? null;
    }

    return {
      userId: p.id,
      fullName: p.full_name,
      role: p.role,
      storeId: p.store_id,
      storeName: storeMap.get(p.store_id) ?? "Unknown store",
      isPlatformAdmin: adminSet.has(p.id),
      createdAt: p.created_at,
      totalTransactionsCreated: tx?.txCount ?? 0,
      totalVolumeProcessed: tx?.volume ?? 0,
      totalFeesGenerated: tx?.fees ?? 0,
      lastActiveAt,
      extractionsConsumed: ledg?.extractions ?? 0,
      creditsConsumed: ledg?.creditsUsed ?? 0,
    };
  });

  // Calculate platform-wide user statistics
  let totalOwners = 0;
  let totalManagers = 0;
  let totalStaff = 0;
  let activeUsers30d = 0;
  let activeUsers7d = 0;

  for (const u of users) {
    if (u.role === "owner") totalOwners += 1;
    else if (u.role === "manager") totalManagers += 1;
    else if (u.role === "staff") totalStaff += 1;

    if (u.lastActiveAt) {
      if (u.lastActiveAt >= since30d) activeUsers30d += 1;
      if (u.lastActiveAt >= since7d) activeUsers7d += 1;
    }
  }

  const topUsersByVolume = [...users]
    .filter((u) => u.totalVolumeProcessed > 0)
    .sort((a, b) => b.totalVolumeProcessed - a.totalVolumeProcessed)
    .slice(0, 5)
    .map((u) => ({
      userId: u.userId,
      fullName: u.fullName,
      storeName: u.storeName,
      volume: u.totalVolumeProcessed,
      transactionCount: u.totalTransactionsCreated,
    }));

  const stats: AdminUserStats = {
    totalUsers: users.length,
    totalOwners,
    totalManagers,
    totalStaff,
    totalPlatformAdmins: adminSet.size,
    activeUsers30d,
    activeUsers7d,
    topUsersByVolume,
  };

  return { users, stats };
}
