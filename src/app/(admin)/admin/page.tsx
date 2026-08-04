import { Store, Zap, Wallet, DollarSign, AlertTriangle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listStoresWithCredits,
  listPendingCreditRequests,
  getPlatformCostReport,
  listRecentExtractionFailures,
  type AdminStoreRow,
} from "@/lib/queries/admin";
import { CostReportPanel } from "@/components/admin/cost-report-panel";
import { ExtractionFailuresPanel } from "@/components/admin/extraction-failures-panel";
import { formatExtractionCost } from "@/lib/format";
import { TrialRequestsPanel } from "@/components/admin/trial-requests-panel";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";
import { StoresOverviewTable } from "@/components/admin/stores-overview-table";

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
  const [allStores, pendingRequests, platformCostReport, extractionFailures] = await Promise.all([
    listStoresWithCredits(supabase),
    listPendingCreditRequests(supabase),
    getPlatformCostReport(supabase),
    listRecentExtractionFailures(supabase),
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
        <ExtractionFailuresPanel failures={extractionFailures} />
      </div>

      <div className="mt-6">
        <CostReportPanel report={platformCostReport} title="Platform cost & usage" />
      </div>

      <div className="mt-6">
        <TrialRequestsPanel requests={pendingRequests} />
      </div>

      <StoresOverviewTable
        stores={stores}
        query={query}
        activeSort={activeSort}
        activeDir={activeDir}
        headerParamsString={headerParams.toString()}
      />
    </div>
  );
}
