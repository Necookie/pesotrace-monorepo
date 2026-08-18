import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { AdminUserDetailData, AdminTransactionRow } from "@/lib/queries/admin-types";
import { computeUserDetailStats } from "@/lib/queries/admin-user-detail-stats";

export async function getAdminUserDetail(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AdminUserDetailData | null> {
  const [
    { data: profile, error: profileError },
    { data: platformAdmin },
    { data: transactions, error: txError },
    { data: ledgerEntries, error: ledgerError },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("transactions")
      .select("*")
      .eq("created_by", userId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("credit_ledger")
      .select("id, entry_type, credit_delta, cost_usd, source_type, note, created_at")
      .eq("created_by", userId)
      .eq("entry_type", "consumption")
      .order("created_at", { ascending: false }),
  ]);

  if (profileError) throw profileError;
  if (txError) throw txError;
  if (ledgerError) throw ledgerError;
  if (!profile) return null;

  // Fetch store name
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("id", profile.store_id)
    .maybeSingle();

  // Sign receipt URLs for recent transactions
  const rawTx = transactions ?? [];
  const paths = rawTx
    .slice(0, 50)
    .map((t) => t.source_file_url)
    .filter((p): p is string => Boolean(p));

  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("transaction-sources")
      .createSignedUrls(paths, 60 * 60);
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) signedByPath.set(item.path, item.signedUrl);
    }
  }

  const enrichedTransactions: AdminTransactionRow[] = rawTx.map((t) => ({
    id: t.id,
    storeId: t.store_id,
    storeName: store?.name ?? "Unknown store",
    direction: t.direction,
    category: t.category,
    amount: Number(t.amount) || 0,
    refNumber: t.ref_number,
    counterpartyNumber: t.counterparty_number,
    counterpartyName: t.counterparty_name,
    occurredAt: t.occurred_at,
    status: t.status,
    feeComputed: Number(t.fee_computed) || 0,
    sourceType: t.source_type,
    sourceFileUrl: t.source_file_url,
    confidence: t.confidence,
    notes: t.notes,
    tags: t.tags ?? [],
    createdBy: t.created_by,
    creatorName: profile.full_name,
    createdAt: t.created_at,
    receiptUrl: t.source_file_url ? (signedByPath.get(t.source_file_url) ?? null) : null,
  }));

  const user = {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    storeId: profile.store_id,
    storeName: store?.name ?? "Unknown store",
    isPlatformAdmin: Boolean(platformAdmin),
    createdAt: profile.created_at,
  };

  return computeUserDetailStats({
    user,
    transactions: enrichedTransactions,
    ledgerEntries: (ledgerEntries ?? []).map((e) => ({
      id: e.id,
      entryType: e.entry_type,
      creditDelta: e.credit_delta,
      costUsd: e.cost_usd,
      sourceType: e.source_type,
      note: e.note,
      createdAt: e.created_at,
    })),
  });
}
