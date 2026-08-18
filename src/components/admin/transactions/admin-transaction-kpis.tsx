import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { formatPeso } from "@/lib/format";
import type { AdminTransactionStats } from "@/lib/queries/admin-types";

export function AdminTransactionKpis({ stats }: { stats: AdminTransactionStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      <AdminKpiTile
        label="Total volume"
        value={formatPeso(stats.totalVolume)}
        icon={TrendingUp}
        accent="primary"
        subtitle={`${stats.totalCount.toLocaleString()} total transactions`}
      />
      <AdminKpiTile
        label="Transactions"
        value={stats.totalCount.toLocaleString()}
        icon={Receipt}
        accent="primary"
        subtitle={`Avg ${formatPeso(stats.avgAmount)}`}
      />
      <AdminKpiTile
        label="Fees computed"
        value={formatPeso(stats.totalFees)}
        icon={Coins}
        accent="up"
        subtitle={`${((stats.totalFees / (stats.totalVolume || 1)) * 100).toFixed(2)}% margin`}
      />
      <AdminKpiTile
        label="Confirmed rate"
        value={`${stats.confirmedRatePct}%`}
        icon={CheckCircle2}
        accent="up"
        subtitle={`${stats.confirmedCount.toLocaleString()} confirmed`}
      />
      <AdminKpiTile
        label="Cash in / Received"
        value={formatPeso(stats.byDirection.receiveVolume)}
        icon={ArrowDownLeft}
        accent="primary"
        subtitle={`${stats.byDirection.receiveCount} transfers`}
      />
      <AdminKpiTile
        label="Cash out / Sent"
        value={formatPeso(stats.byDirection.sendVolume)}
        icon={ArrowUpRight}
        accent="muted"
        subtitle={`${stats.byDirection.sendCount} transfers`}
      />
    </div>
  );
}
