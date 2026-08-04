import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Wallet, TrendingUp, Receipt, Percent } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { listTransactions } from "@/lib/queries/transactions";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { Amount } from "@/components/shared/amount";
import { StatusBadge } from "@/components/ledger/status-badge";
import { CategoryBadge } from "@/components/ledger/category-badge";
import { formatPeso, formatDateTime } from "@/lib/format";

const RECENT_TRANSACTIONS_LIMIT = 10;

/**
 * Read-only preview of what a store owner's own dashboard shows them, built
 * from the same query functions the real dashboard uses — not a session
 * impersonation, just the numbers rendered admin-side so support can see
 * what the owner is looking at without asking them to screen-share.
 */
export default async function AdminStorePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: store } = await supabase.from("stores").select("id, name").eq("id", id).maybeSingle();
  if (!store) notFound();

  const [stats, { rows: recentTransactions }] = await Promise.all([
    getDashboardStats(supabase, id),
    listTransactions(supabase, id, {}, RECENT_TRANSACTIONS_LIMIT),
  ]);

  return (
    <div>
      <Link
        href={`/admin/stores/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Back to store
      </Link>

      <div className="mt-2 flex items-center gap-2">
        <Eye className="size-5 text-primary" />
        <h1 className="text-2xl font-medium text-ink">Viewing as {store.name}</h1>
      </div>
      <p className="mt-1 text-sm text-body">
        Read-only preview of this store&apos;s own dashboard numbers — the same data they see, rendered here so
        you don&apos;t need them to screen-share. No session is created; you can&apos;t take actions as this
        store from this page.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AdminKpiTile label="Today's income" value={formatPeso(stats.todayIncome)} icon={Wallet} accent="up" />
        <AdminKpiTile label="Total volume (30d)" value={formatPeso(stats.totalVolume)} icon={TrendingUp} accent="primary" />
        <AdminKpiTile label="Transactions (30d)" value={stats.transactionCount.toLocaleString()} icon={Receipt} accent="primary" />
        <AdminKpiTile label="Fees earned (30d)" value={formatPeso(stats.feesEarned)} icon={Percent} accent="muted" />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent transactions</h2>
        <div className="flex flex-col gap-3">
          {recentTransactions.map((row) => (
            <div key={row.id} className="rounded-2xl border border-hairline p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {row.counterparty_name || row.counterparty_number || "Unknown"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{formatDateTime(row.occurred_at)}</p>
                </div>
                <Amount value={Number(row.amount)} direction={row.direction} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <CategoryBadge category={row.category} />
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <div className="rounded-2xl border border-hairline py-10 text-center text-muted">
              This store has no transactions yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
