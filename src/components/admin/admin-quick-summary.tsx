import { ShieldCheck, AlertCircle, BarChart3, TrendingUp } from "lucide-react";
import Link from "next/link";
import { computeStoreHealth } from "@/lib/admin-health";
import type { AdminStoreRow } from "@/lib/queries/admin";
import { formatExtractionCost } from "@/lib/format";

export function AdminQuickSummary({ stores }: { stores: AdminStoreRow[] }) {
  if (stores.length === 0) return null;

  const healthCounts = stores.reduce(
    (acc, store) => {
      const health = computeStoreHealth(store);
      acc[health.status] = (acc[health.status] || 0) + 1;
      return acc;
    },
    { healthy: 0, warning: 0, critical: 0, inactive: 0 } as Record<string, number>
  );

  const sortedByCost = [...stores].sort((a, b) => b.costUsdThisMonth - a.costUsdThisMonth).slice(0, 3);

  const attentionRequired = healthCounts.critical + healthCounts.warning;

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-ink">Store Health & Usage Summary</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="size-3.5" />
            {healthCounts.healthy} Healthy
          </span>
          {attentionRequired > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <AlertCircle className="size-3.5" />
              {attentionRequired} Need Attention
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-hairline bg-surface-soft p-3">
          <p className="text-xs text-muted">Health Distribution</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-body font-medium">{healthCounts.healthy} Healthy</span>
            <span className="text-xs text-muted">/</span>
            <span className="inline-block size-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-body font-medium">{healthCounts.warning} Warning</span>
            <span className="text-xs text-muted">/</span>
            <span className="inline-block size-2.5 rounded-full bg-rose-500" />
            <span className="text-xs text-body font-medium">{healthCounts.critical} Critical</span>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-surface-soft p-3 sm:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Top Consuming Stores (30d)</p>
            <TrendingUp className="size-3.5 text-muted" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {sortedByCost.map((store) => (
              <Link
                key={store.storeId}
                href={`/admin/stores/${store.storeId}`}
                className="flex items-center gap-1.5 text-xs text-body hover:text-primary transition-colors"
              >
                <span className="font-medium text-ink">{store.storeName}:</span>
                <span className="font-mono text-muted">{formatExtractionCost(store.costUsdThisMonth)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
