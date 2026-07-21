import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { CreditUsagePoint } from "@/components/charts/credit-usage-chart";
import { formatDate } from "@/lib/format";

export type AdminStoreRow = {
  storeId: string;
  storeName: string;
  balance: number;
  extractionsThisMonth: number;
  costUsdThisMonth: number;
  lastActivityAt: string | null;
  dailyUsage: CreditUsagePoint[];
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

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
      .select("store_id, entry_type, credit_delta, cost_usd, created_at")
      .eq("entry_type", "consumption")
      .gte("created_at", since30d),
  ]);

  if (storesError) throw storesError;
  if (creditsError) throw creditsError;
  if (ledgerError) throw ledgerError;

  const balanceByStore = new Map((credits ?? []).map((c) => [c.store_id, c.balance]));

  const usageByStore = new Map<
    string,
    { extractions: number; costUsd: number; lastActivityAt: string; byDay: Map<string, number> }
  >();
  for (const entry of recentLedger ?? []) {
    let existing = usageByStore.get(entry.store_id);
    if (!existing) {
      existing = { extractions: 0, costUsd: 0, lastActivityAt: entry.created_at, byDay: new Map() };
      usageByStore.set(entry.store_id, existing);
    }
    existing.extractions += 1;
    existing.costUsd += entry.cost_usd;
    if (entry.created_at > existing.lastActivityAt) existing.lastActivityAt = entry.created_at;

    const key = dayKey(entry.created_at);
    existing.byDay.set(key, (existing.byDay.get(key) ?? 0) + Math.abs(entry.credit_delta));
  }

  return (stores ?? []).map((store) => {
    const usage = usageByStore.get(store.id);
    const dailyUsage: CreditUsagePoint[] = usage
      ? [...usage.byDay.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, creditsUsed]) => ({ label: formatDate(day), credits: creditsUsed }))
      : [];

    return {
      storeId: store.id,
      storeName: store.name,
      balance: balanceByStore.get(store.id) ?? 0,
      extractionsThisMonth: usage?.extractions ?? 0,
      costUsdThisMonth: usage?.costUsd ?? 0,
      lastActivityAt: usage?.lastActivityAt ?? null,
      dailyUsage,
    };
  });
}
