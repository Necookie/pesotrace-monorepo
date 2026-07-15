import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { TopCounterparties } from "@/components/dashboard/top-counterparties";
import { buttonVariants } from "@/components/ui/button";
import { formatPeso } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  if (!storeId) {
    return (
      <div className="p-8 text-body">Setting up your store — refresh in a moment.</div>
    );
  }

  const stats = await getDashboardStats(supabase, storeId);

  if (stats.transactionCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-medium text-ink">No transactions yet</h1>
        <p className="max-w-sm text-body">
          Upload your first GCash screenshot to start tracking transactions.
        </p>
        <Link href="/upload" className={buttonVariants()}>
          Upload your first screenshot
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-ink">Dashboard</h1>
        {stats.needsReviewCount > 0 && (
          <Link
            href="/ledger?status=needs_review"
            className="rounded-pill bg-surface-strong px-3 py-1.5 text-sm font-medium text-ink"
          >
            {stats.needsReviewCount} need review &rarr;
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiTile label="Volume (30d)" value={formatPeso(stats.totalVolume)} />
        <KpiTile label="Transactions" value={String(stats.transactionCount)} />
        <KpiTile label="Total Income" value={formatPeso(stats.feesEarned)} />
        <KpiTile label="Avg. Size" value={formatPeso(stats.avgSize)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-ink">Send vs. Receive</h2>
          <TrendChart data={stats.trend} />
        </div>
        <TopCounterparties items={stats.topCounterparties} />
      </div>
    </div>
  );
}
