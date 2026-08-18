import { TrendingUp, Receipt, Coins, CheckCircle2, Zap, Activity } from "lucide-react";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { formatPeso, formatRelativeTime, formatExtractionCost } from "@/lib/format";
import type { AdminUserDetailData } from "@/lib/queries/admin-types";

export function UserDetailKpis({ stats }: { stats: AdminUserDetailData["stats"] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      <AdminKpiTile
        label="Volume Handled"
        value={formatPeso(stats.totalVolume)}
        icon={TrendingUp}
        accent="primary"
        subtitle={`Avg ${formatPeso(stats.avgAmount)}`}
      />
      <AdminKpiTile
        label="Transactions"
        value={stats.totalTransactions.toLocaleString()}
        icon={Receipt}
        accent="primary"
        subtitle={`${stats.confirmedCount} confirmed`}
      />
      <AdminKpiTile
        label="Fees Generated"
        value={formatPeso(stats.totalFees)}
        icon={Coins}
        accent="up"
        subtitle={`${((stats.totalFees / (stats.totalVolume || 1)) * 100).toFixed(2)}% margin`}
      />
      <AdminKpiTile
        label="Accuracy Rate"
        value={`${stats.confirmedRatePct}%`}
        icon={CheckCircle2}
        accent="up"
        subtitle={`${stats.needsReviewCount} review needed`}
      />
      <AdminKpiTile
        label="Extractions"
        value={stats.extractionsCount.toLocaleString()}
        icon={Zap}
        accent="muted"
        subtitle={`${stats.creditsUsed} credits (${formatExtractionCost(stats.costUsd)})`}
      />
      <AdminKpiTile
        label="Last Active"
        value={stats.lastActiveAt ? formatRelativeTime(stats.lastActiveAt) : "Never"}
        icon={Activity}
        accent="primary"
        subtitle="Recent activity"
      />
    </div>
  );
}
