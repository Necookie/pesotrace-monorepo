import { Users, Crown, Shield, ShieldCheck, Activity, Zap } from "lucide-react";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import type { AdminUserStats } from "@/lib/queries/admin-types";

export function AdminUserKpis({ stats }: { stats: AdminUserStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      <AdminKpiTile
        label="Total Users"
        value={stats.totalUsers.toLocaleString()}
        icon={Users}
        accent="primary"
        subtitle="Accounts across stores"
      />
      <AdminKpiTile
        label="Store Owners"
        value={stats.totalOwners.toLocaleString()}
        icon={Crown}
        accent="up"
        subtitle="Store creators"
      />
      <AdminKpiTile
        label="Staff & Managers"
        value={(stats.totalManagers + stats.totalStaff).toLocaleString()}
        icon={Shield}
        accent="muted"
        subtitle={`${stats.totalManagers} mgr / ${stats.totalStaff} staff`}
      />
      <AdminKpiTile
        label="Platform Admins"
        value={stats.totalPlatformAdmins.toLocaleString()}
        icon={ShieldCheck}
        accent="primary"
        subtitle="Operators with full access"
      />
      <AdminKpiTile
        label="Active (30d)"
        value={stats.activeUsers30d.toLocaleString()}
        icon={Activity}
        accent="up"
        subtitle={`${Math.round((stats.activeUsers30d / (stats.totalUsers || 1)) * 100)}% of total`}
      />
      <AdminKpiTile
        label="Active (7d)"
        value={stats.activeUsers7d.toLocaleString()}
        icon={Zap}
        accent="primary"
        subtitle="Recent activity"
      />
    </div>
  );
}
