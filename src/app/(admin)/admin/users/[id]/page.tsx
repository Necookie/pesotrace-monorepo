import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUserDetail } from "@/lib/queries/admin-user-detail";
import { UserDetailHeader } from "@/components/admin/users/user-detail-header";
import { UserDetailKpis } from "@/components/admin/users/user-detail-kpis";
import { UserDetailCharts } from "@/components/admin/users/user-detail-charts";
import { UserDetailTables } from "@/components/admin/users/user-detail-tables";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `User Dashboard | PesoTrace Admin`,
    description: `Detailed activity metrics, transaction breakdown, and audit logs for user ${id}.`,
  };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const userDetail = await getAdminUserDetail(supabase, id);
  if (!userDetail) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header with store link & role badges */}
      <UserDetailHeader user={userDetail.user} />

      {/* KPI Tiles */}
      <UserDetailKpis stats={userDetail.stats} />

      {/* Velocity & Category Breakdown Charts */}
      <UserDetailCharts data={userDetail} />

      {/* User Transaction History & Extractions Ledger */}
      <UserDetailTables
        transactions={userDetail.recentTransactions}
        extractions={userDetail.recentExtractions}
      />
    </div>
  );
}
