import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

export type DashboardStats = {
  totalVolume: number;
  transactionCount: number;
  feesEarned: number;
  avgSize: number;
  needsReviewCount: number;
  topCounterparties: { name: string; amount: number }[];
  trend: { label: string; send: number; receive: number }[];
};

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function getDashboardStats(
  supabase: SupabaseClient<Database>,
  storeId: string
): Promise<DashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("store_id", storeId)
    .gte("occurred_at", since.toISOString());

  if (error) throw error;
  const rows: Row[] = data ?? [];

  const totalVolume = rows.reduce((sum, r) => sum + Number(r.amount), 0);
  const feesEarned = rows.reduce((sum, r) => sum + Number(r.fee_computed), 0);
  const needsReviewCount = rows.filter((r) => r.status === "needs_review").length;

  const counterpartyTotals = new Map<string, number>();
  for (const r of rows) {
    const name = r.counterparty_name || r.counterparty_number || "Unknown";
    counterpartyTotals.set(name, (counterpartyTotals.get(name) ?? 0) + Number(r.amount));
  }
  const topCounterparties = [...counterpartyTotals.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const byDay = new Map<string, { send: number; receive: number }>();
  for (const r of rows) {
    const key = dayKey(r.occurred_at);
    const entry = byDay.get(key) ?? { send: 0, receive: 0 };
    if (r.direction === "send") entry.send += Number(r.amount);
    else entry.receive += Number(r.amount);
    byDay.set(key, entry);
  }
  const trend = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, ...v }));

  return {
    totalVolume,
    transactionCount: rows.length,
    feesEarned,
    avgSize: rows.length > 0 ? totalVolume / rows.length : 0,
    needsReviewCount,
    topCounterparties,
    trend,
  };
}
