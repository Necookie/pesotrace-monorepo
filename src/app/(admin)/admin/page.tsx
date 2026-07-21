import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { listStoresWithCredits, listPendingCreditRequests } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { CreditUsageChart } from "@/components/charts/credit-usage-chart";
import { TrialRequestsPanel } from "@/components/admin/trial-requests-panel";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();
  const [stores, pendingRequests] = await Promise.all([
    listStoresWithCredits(supabase),
    listPendingCreditRequests(supabase),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">Stores</h1>
      <p className="mt-1 text-sm text-body">Credit balances and usage across every store.</p>

      <div className="mt-6">
        <TrialRequestsPanel requests={pendingRequests} />
      </div>

      <div className="rounded-2xl border border-hairline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Credit balance</TableHead>
              <TableHead className="text-right">Extractions (30d)</TableHead>
              <TableHead className="text-right">Real cost (30d)</TableHead>
              <TableHead>Usage trend</TableHead>
              <TableHead className="text-right">Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.storeId}>
                <TableCell>
                  <Link href={`/admin/stores/${store.storeId}`} className="font-medium text-ink hover:text-primary">
                    {store.storeName}
                  </Link>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono",
                    store.balance <= 0 ? "text-down" : "text-ink"
                  )}
                >
                  {store.balance.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-body">
                  {store.extractionsThisMonth.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-body">
                  {formatExtractionCost(store.costUsdThisMonth)}
                </TableCell>
                <TableCell>
                  <CreditUsageChart data={store.dailyUsage} compact />
                </TableCell>
                <TableCell className="text-right text-sm text-muted">
                  {store.lastActivityAt ? formatDateTime(store.lastActivityAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted">
                  No stores yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
