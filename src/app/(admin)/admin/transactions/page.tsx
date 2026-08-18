import { createAdminClient } from "@/lib/supabase/admin";
import { listAdminTransactions } from "@/lib/queries/admin-transactions";
import { parseAdminTransactionFilters } from "@/lib/admin-filters";
import { AdminTransactionKpis } from "@/components/admin/transactions/admin-transaction-kpis";
import { AdminTransactionFilters } from "@/components/admin/transactions/admin-transaction-filters";
import { AdminTransactionCharts } from "@/components/admin/transactions/admin-transaction-charts";
import { AdminTransactionTable } from "@/components/admin/transactions/admin-transaction-table";
import { AdminTransactionExportButton } from "@/components/admin/transactions/admin-transaction-export-button";

export const metadata = {
  title: "Transactions Dashboard | PesoTrace Admin",
  description: "Global cross-store transaction explorer, volume charts, fee margins, and reconciliation.",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filterParams = parseAdminTransactionFilters(params);
  const supabase = createAdminClient();

  const [{ data: storesData }, result] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    listAdminTransactions(supabase, filterParams),
  ]);

  const stores = (storesData ?? []).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink">Transactions Dashboard</h1>
          <p className="mt-1 text-sm text-body">
            Explore and audit all transactions, fee earnings, and payment flows across every store.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AdminTransactionExportButton transactions={result.transactions} />
        </div>
      </div>

      {/* KPI Tiles */}
      <AdminTransactionKpis stats={result.stats} />

      {/* Visual Analytics Charts */}
      <AdminTransactionCharts stats={result.stats} />

      {/* Multi-filter Bar */}
      <AdminTransactionFilters stores={stores} />

      {/* Transactions Table with Pagination & Receipt Preview */}
      <AdminTransactionTable
        transactions={result.transactions}
        totalCount={result.totalCount}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        query={filterParams.q}
      />
    </div>
  );
}
