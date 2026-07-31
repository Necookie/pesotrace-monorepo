import Link from "next/link";
import { Store, Zap, Wallet, DollarSign, AlertTriangle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listStoresWithCredits,
  listPendingCreditRequests,
  getPlatformUsageTrend,
  type AdminStoreRow,
} from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { CreditUsageChart } from "@/components/charts/lazy";
import { TrialRequestsPanel } from "@/components/admin/trial-requests-panel";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { StoreRowDeleteButton } from "@/components/admin/store-row-delete-button";
import { FeeConfigBadge } from "@/components/admin/fee-config-badge";
import { StoreSearch } from "@/components/admin/store-search";
import { SortableHeader } from "@/components/admin/sortable-header";

type SortKey = "name" | "balance" | "today" | "extractions" | "cost" | "activity";

const SORT_ACCESSORS: Record<SortKey, (s: AdminStoreRow) => number | string> = {
  name: (s) => s.storeName.toLowerCase(),
  balance: (s) => s.balance,
  today: (s) => s.requestsToday,
  extractions: (s) => s.extractionsThisMonth,
  cost: (s) => s.costUsdThisMonth,
  activity: (s) => s.lastActivityAt ?? "",
};

function sortStores(stores: AdminStoreRow[], sort: string | undefined, dir: string | undefined) {
  const key: SortKey = sort && sort in SORT_ACCESSORS ? (sort as SortKey) : "name";
  const direction = dir === "desc" ? -1 : 1;
  const accessor = SORT_ACCESSORS[key];

  return [...stores].sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return 0;
  });
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const [allStores, pendingRequests, platformUsageTrend] = await Promise.all([
    listStoresWithCredits(supabase),
    listPendingCreditRequests(supabase),
    getPlatformUsageTrend(supabase),
  ]);

  const query = (params.q ?? "").trim().toLowerCase();
  const filteredStores = query
    ? allStores.filter((s) => s.storeName.toLowerCase().includes(query))
    : allStores;
  const stores = sortStores(filteredStores, params.sort, params.dir);

  const headerParams = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[0] !== "sort" && entry[0] !== "dir" && entry[1] !== undefined
    )
  );
  const activeSort = params.sort ?? "name";
  const activeDir: "asc" | "desc" = params.dir === "desc" ? "desc" : "asc";

  const totalBalance = allStores.reduce((sum, s) => sum + s.balance, 0);
  const totalCost30d = allStores.reduce((sum, s) => sum + s.costUsdThisMonth, 0);
  const storesOutOfCredits = allStores.filter((s) => s.balance <= 0).length;
  const requestsToday = allStores.reduce((sum, s) => sum + s.requestsToday, 0);

  return (
    <div>
      <h1 className="text-2xl font-medium text-ink">Stores</h1>
      <p className="mt-1 text-sm text-body">Credit balances and usage across every store.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <AdminKpiTile label="Stores" value={String(stores.length)} icon={Store} accent="primary" />
        <AdminKpiTile label="Requests today" value={String(requestsToday)} icon={Zap} accent="primary" />
        <AdminKpiTile
          label="Total credit balance"
          value={totalBalance.toLocaleString()}
          icon={Wallet}
          accent="up"
        />
        <AdminKpiTile
          label="Real cost (30d)"
          value={formatExtractionCost(totalCost30d)}
          icon={DollarSign}
          accent="muted"
        />
        <AdminKpiTile
          label="Out of credits"
          value={String(storesOutOfCredits)}
          icon={AlertTriangle}
          accent={storesOutOfCredits > 0 ? "down" : "muted"}
        />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Platform usage trend (30d)</h2>
        <CreditUsageChart data={platformUsageTrend} />
      </div>

      <div className="mt-6">
        <TrialRequestsPanel requests={pendingRequests} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          All stores <span className="font-normal text-muted">({stores.length})</span>
        </h2>
        <StoreSearch />
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-hairline md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3 pl-4">
                <SortableHeader label="Store" sortKey="name" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} />
              </TableHead>
              <TableHead className="py-3">Fee setup</TableHead>
              <TableHead className="py-3 text-right">
                <SortableHeader label="Credit balance" sortKey="balance" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} align="right" />
              </TableHead>
              <TableHead className="py-3 text-right">
                <SortableHeader label="Today" sortKey="today" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} align="right" />
              </TableHead>
              <TableHead className="py-3 text-right">
                <SortableHeader label="Extractions (30d)" sortKey="extractions" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} align="right" />
              </TableHead>
              <TableHead className="py-3 text-right">
                <SortableHeader label="Real cost (30d)" sortKey="cost" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} align="right" />
              </TableHead>
              <TableHead className="py-3">Usage trend</TableHead>
              <TableHead className="py-3 text-right">
                <SortableHeader label="Last activity" sortKey="activity" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} align="right" />
              </TableHead>
              <TableHead className="w-10 py-3 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow
                key={store.storeId}
                className={cn(store.balance <= 0 && "border-l-2 border-l-down bg-down/5")}
              >
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
                <TableCell className="max-w-56 py-3">
                  <FeeConfigBadge summary={store.feeConfig} />
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
                <TableCell colSpan={9} className="py-10 text-center text-muted">
                  {query ? `No stores match "${params.q}".` : "No stores yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {stores.map((store) => (
          <div
            key={store.storeId}
            className={cn(
              "rounded-2xl border border-hairline p-4",
              store.balance <= 0 && "border-l-2 border-l-down bg-down/5"
            )}
          >
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

            <div className="mt-3">
              <p className="text-xs text-muted">Fee setup</p>
              <FeeConfigBadge summary={store.feeConfig} className="mt-1" />
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
          <div className="rounded-2xl border border-hairline py-10 text-center text-muted">
            {query ? `No stores match "${params.q}".` : "No stores yet."}
          </div>
        )}
      </div>
    </div>
  );
}
