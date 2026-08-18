import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { AdminUserRow, AdminUserStats } from "@/lib/queries/admin-types";
import { buildAdminUsersData } from "@/lib/queries/admin-users-stats";

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

  const { users: rawUsers, stats } = buildAdminUsersData({
    profiles: profiles ?? [],
    stores: stores ?? [],
    platformAdmins: platformAdmins ?? [],
    transactions: transactions ?? [],
    ledgerEntries: ledgerEntries ?? [],
  });

  let allUsers = rawUsers;

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
