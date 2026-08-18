import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { AdminUserRow, AdminUserStats } from "@/lib/queries/admin-types";

export type AdminUsersQueryResult = {
  users: AdminUserRow[];
  stats: AdminUserStats;
  totalCount: number;
};

export async function listAdminUsers(
  supabase: SupabaseClient<Database>,
  options?: {
    query?: string;
    role?: string;
    storeId?: string;
    sortBy?: "name" | "volume" | "transactions" | "role" | "created" | "activity";
    sortDir?: "asc" | "desc";
  }
): Promise<AdminUsersQueryResult> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch profiles, stores, platform admins, and aggregate usage
  const [
    { data: profiles, error: profilesError },
    { data: stores, error: storesError },
    { data: platformAdmins, error: adminsError },
    { data: transactions, error: txError },
    { data: ledgerEntries, error: ledgerError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("stores").select("id, name"),
    supabase.from("platform_admins").select("user_id"),
    supabase.from("transactions").select("created_by, amount, fee_computed, occurred_at, created_at"),
    supabase
      .from("credit_ledger")
      .select("created_by, credit_delta, cost_usd, entry_type, created_at")
      .eq("entry_type", "consumption"),
  ]);

  if (profilesError) throw profilesError;
  if (storesError) throw storesError;
  if (adminsError) throw adminsError;
  if (txError) throw txError;
  if (ledgerError) throw ledgerError;

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
  let allUsers: AdminUserRow[] = (profiles ?? []).map((p) => {
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

  for (const u of allUsers) {
    if (u.role === "owner") totalOwners += 1;
    else if (u.role === "manager") totalManagers += 1;
    else if (u.role === "staff") totalStaff += 1;

    if (u.lastActiveAt) {
      if (u.lastActiveAt >= since30d) activeUsers30d += 1;
      if (u.lastActiveAt >= since7d) activeUsers7d += 1;
    }
  }

  const topUsersByVolume = [...allUsers]
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
    totalUsers: allUsers.length,
    totalOwners,
    totalManagers,
    totalStaff,
    totalPlatformAdmins: adminSet.size,
    activeUsers30d,
    activeUsers7d,
    topUsersByVolume,
  };

  // Apply filters
  if (options?.query) {
    const q = options.query.toLowerCase().trim();
    allUsers = allUsers.filter(
      (u) =>
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        u.userId.toLowerCase().includes(q) ||
        u.storeName.toLowerCase().includes(q)
    );
  }

  if (options?.role) {
    allUsers = allUsers.filter((u) => u.role === options.role);
  }

  if (options?.storeId) {
    allUsers = allUsers.filter((u) => u.storeId === options.storeId);
  }

  // Apply sorting
  const sortBy = options?.sortBy || "created";
  const sortDir = options?.sortDir === "asc" ? 1 : -1;

  allUsers.sort((a, b) => {
    if (sortBy === "name") {
      const aName = a.fullName || a.userId;
      const bName = b.fullName || b.userId;
      return aName.localeCompare(bName) * sortDir;
    }
    if (sortBy === "volume") {
      return (a.totalVolumeProcessed - b.totalVolumeProcessed) * sortDir;
    }
    if (sortBy === "transactions") {
      return (a.totalTransactionsCreated - b.totalTransactionsCreated) * sortDir;
    }
    if (sortBy === "role") {
      return a.role.localeCompare(b.role) * sortDir;
    }
    if (sortBy === "activity") {
      const aAct = a.lastActiveAt ?? "";
      const bAct = b.lastActiveAt ?? "";
      return aAct.localeCompare(bAct) * sortDir;
    }
    // Default created_at
    return a.createdAt.localeCompare(b.createdAt) * sortDir;
  });

  return {
    users: allUsers,
    stats,
    totalCount: allUsers.length,
  };
}
