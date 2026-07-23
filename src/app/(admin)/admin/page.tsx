import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { listStoresWithCredits, listPendingCreditRequests } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { CreditUsageChart } from "@/components/charts/credit-usage-chart";
import { TrialRequestsPanel } from "@/components/admin/trial-requests-panel";
import { KpiTile } from "@/components/dashboard/kpi-tile";
import { StoreRowDeleteButton } from "@/components/admin/store-row-delete-button";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();
  const [stores, pendingRequests] = await Promise.all([
    listStoresWithCredits(supabase),
    listPendingCreditRequests(supabase),
  ]);

  const totalBalance = stores.reduce((sum, s) => sum + s.balance, 0);
  const totalCost30d = stores.reduce((sum, s) => sum + s.costUsdThisMonth, 0);
  const storesOutOfCredits = stores.filter((s) => s.balance <= 0).length;
  const requestsToday = stores.reduce((sum, s) => sum + s.requestsToday, 0);

  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Stores</h1>
      <p className="mt-1 text-sm text-body">Credit balances and usage across every store.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile label="Stores" value={String(stores.length)} />
        <KpiTile label="Requests today" value={String(requestsToday)} />
        <KpiTile label="Total credit balance" value={totalBalance.toLocaleString()} />
        <KpiTile label="Real cost (30d)" value={formatExtractionCost(totalCost30d)} />
        <KpiTile label="Out of credits" value={String(storesOutOfCredits)} />
      </div>

      <div className="mt-6">
        <TrialRequestsPanel requests={pendingRequests} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink">All stores</h2>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-hairline md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 pl-4">Store</TableHead>
              <TableHead className="py-3 text-right">Credit balance</TableHead>
              <TableHead className="py-3 text-right">Today</TableHead>
              <TableHead className="py-3 text-right">Extractions (30d)</TableHead>
              <TableHead className="py-3 text-right">Real cost (30d)</TableHead>
              <TableHead className="py-3">Usage trend</TableHead>
              <TableHead className="py-3 text-right">Last activity</TableHead>
              <TableHead className="w-10 py-3 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.storeId}>
                <TableCell className="py-3 pl-4">
                  <Link href={`/admin/stores/${store.storeId}`} className="font-medium text-ink hover:text-primary">
                    {store.storeName}
                  </Link>
                  {store.balance <= 0 && (
                    <span className="ml-2 inline-block rounded-pill bg-surface-strong px-2 py-0.5 text-[11px] font-medium text-down">
                      Out of credits
                    </span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "py-3 text-right font-mono",
                    store.balance <= 0 ? "text-down" : "text-ink"
                  )}
                >
                  {store.balance.toLocaleString()}
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-body">
                  {store.requestsToday.toLocaleString()}
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-body">
                  {store.extractionsThisMonth.toLocaleString()}
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-body">
                  {formatExtractionCost(store.costUsdThisMonth)}
                </TableCell>
                <TableCell className="py-3">
                  <CreditUsageChart data={store.dailyUsage} compact />
                </TableCell>
                <TableCell className="py-3 text-right text-sm text-muted">
                  {store.lastActivityAt ? formatDateTime(store.lastActivityAt) : "—"}
                </TableCell>
                <TableCell className="py-3 pr-4">
                  <StoreRowDeleteButton storeId={store.storeId} storeName={store.storeName} />
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted">
                  No stores yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {stores.map((store) => (
          <div key={store.storeId} className="rounded-2xl border border-hairline p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/admin/stores/${store.storeId}`}
                  className="font-medium text-ink hover:text-primary"
                >
                  {store.storeName}
                </Link>
                {store.balance <= 0 && (
                  <span className="ml-2 inline-block rounded-pill bg-surface-strong px-2 py-0.5 text-[11px] font-medium text-down">
                    Out of credits
                  </span>
                )}
              </div>
              <StoreRowDeleteButton storeId={store.storeId} storeName={store.storeName} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted">Balance</p>
                <p className={cn("font-mono text-sm", store.balance <= 0 ? "text-down" : "text-ink")}>
                  {store.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Today</p>
                <p className="font-mono text-sm text-ink">{store.requestsToday.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Extractions (30d)</p>
                <p className="font-mono text-sm text-ink">{store.extractionsThisMonth.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Real cost (30d)</p>
                <p className="font-mono text-sm text-ink">{formatExtractionCost(store.costUsdThisMonth)}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <CreditUsageChart data={store.dailyUsage} compact />
              <p className="text-xs text-muted">
                {store.lastActivityAt ? formatDateTime(store.lastActivityAt) : "No activity yet"}
              </p>
            </div>
          </div>
        ))}
        {stores.length === 0 && (
          <div className="rounded-2xl border border-hairline py-10 text-center text-muted">No stores yet.</div>
        )}
      </div>
    </div>
  );
}
