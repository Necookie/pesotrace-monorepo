import { createAdminClient } from "@/lib/supabase/admin";
import { listAdminUsers } from "@/lib/queries/admin-users";
import { AdminUserKpis } from "@/components/admin/users/admin-user-kpis";
import { AdminUsersTable } from "@/components/admin/users/admin-users-table";
import { AdminUserExportButton } from "@/components/admin/users/admin-user-export-button";

export const metadata = {
  title: "Users Directory | PesoTrace Admin",
  description: "Cross-store user accounts, roles, processed transaction volumes, and operator permissions.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    storeId?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const [{ data: storesData }, { users, stats }] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    listAdminUsers(supabase, {
      query: params.q,
      role: params.role,
      storeId: params.storeId,
      sortBy: (params.sort as any) ?? "created",
      sortDir: (params.dir as any) ?? "desc",
    }),
  ]);

  const stores = (storesData ?? []).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink">Users Directory</h1>
          <p className="mt-1 text-sm text-body">
            User accounts, roles, activity, and volume handled across all merchants.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AdminUserExportButton users={users} />
        </div>
      </div>

      {/* KPI Tiles */}
      <AdminUserKpis stats={stats} />

      {/* Users Directory Table */}
      <AdminUsersTable
        users={users}
        query={params.q}
        selectedRole={params.role}
        selectedStoreId={params.storeId}
        stores={stores}
      />
    </div>
  );
}
