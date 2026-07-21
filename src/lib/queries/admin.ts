import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type AdminStoreRow = {
  storeId: string;
  storeName: string;
  balance: number;
  extractionsThisMonth: number;
  costUsdThisMonth: number;
  lastActivityAt: string | null;
};

export async function listStoresWithCredits(
  supabase: SupabaseClient<Database>
): Promise<AdminStoreRow[]> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: stores, error: storesError },
    { data: credits, error: creditsError },
    { data: recentLedger, error: ledgerError },
  ] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    supabase.from("store_credits").select("store_id, balance"),
    supabase
      .from("credit_ledger")
      .select("store_id, entry_type, cost_usd, created_at")
      .eq("entry_type", "consumption")
      .gte("created_at", since30d),
  ]);

  if (storesError) throw storesError;
  if (creditsError) throw creditsError;
  if (ledgerError) throw ledgerError;

  const balanceByStore = new Map((credits ?? []).map((c) => [c.store_id, c.balance]));

  const usageByStore = new Map<string, { extractions: number; costUsd: number; lastActivityAt: string }>();
  for (const entry of recentLedger ?? []) {
    const existing = usageByStore.get(entry.store_id);
    if (existing) {
      existing.extractions += 1;
      existing.costUsd += entry.cost_usd;
      if (entry.created_at > existing.lastActivityAt) existing.lastActivityAt = entry.created_at;
    } else {
      usageByStore.set(entry.store_id, {
        extractions: 1,
        costUsd: entry.cost_usd,
        lastActivityAt: entry.created_at,
      });
    }
  }

  return (stores ?? []).map((store) => {
    const usage = usageByStore.get(store.id);
    return {
      storeId: store.id,
      storeName: store.name,
      balance: balanceByStore.get(store.id) ?? 0,
      extractionsThisMonth: usage?.extractions ?? 0,
      costUsdThisMonth: usage?.costUsd ?? 0,
      lastActivityAt: usage?.lastActivityAt ?? null,
    };
  });
}
