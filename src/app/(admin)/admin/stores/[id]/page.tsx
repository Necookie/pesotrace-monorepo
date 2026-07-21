import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreCreditDetail } from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreditUsageChart } from "@/components/charts/credit-usage-chart";
import { RequestVolumeChart } from "@/components/charts/request-volume-chart";
import { AdjustCreditsForm } from "@/components/admin/adjust-credits-form";
import { RenameStoreForm } from "@/components/admin/rename-store-form";
import { StoreDangerZoneCard } from "@/components/admin/store-danger-zone-card";
import { KpiTile } from "@/components/dashboard/kpi-tile";

const ENTRY_TYPE_LABEL: Record<string, string> = {
  grant: "Grant",
  consumption: "Consumption",
  adjustment: "Adjustment",
  refund: "Refund",
};

const ENTRY_TYPE_TEXT_COLOR: Record<string, string> = {
  grant: "text-up",
  consumption: "text-muted",
  adjustment: "text-primary",
  refund: "text-up",
};

export default async function AdminStoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const detail = await getStoreCreditDetail(supabase, id);

  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          All stores
        </Link>
        <h1 className="mt-2 text-2xl font-medium text-ink">{detail.storeName}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-hairline bg-canvas p-4 sm:p-6">
          <p className="text-xs text-muted sm:text-sm">Credit balance</p>
          <p
            className={cn(
              "mt-1.5 font-mono text-lg font-semibold sm:text-2xl",
              detail.balance <= 0 ? "text-down" : "text-ink"
            )}
          >
            {detail.balance.toLocaleString()}
          </p>
        </div>
        <KpiTile label="Requests today" value={String(detail.requestsToday)} />
        <KpiTile label="Requests this week" value={String(detail.requestsThisWeek)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RenameStoreForm storeId={detail.storeId} currentName={detail.storeName} />
        <AdjustCreditsForm storeId={detail.storeId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Requests per day (30d)</h2>
          <RequestVolumeChart data={detail.dailyRequestCounts} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Credit usage (30d)</h2>
          <CreditUsageChart data={detail.dailyUsage} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">Ledger history</h2>
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-3 pl-4">Type</TableHead>
                <TableHead className="py-3 text-right">Credits</TableHead>
                <TableHead className="py-3 text-right">Real cost</TableHead>
                <TableHead className="py-3">Note</TableHead>
                <TableHead className="py-3">Actor</TableHead>
                <TableHead className="py-3 pr-4 text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.ledger.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="py-3 pl-4">
                    <span
                      className={cn(
                        "inline-block rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium",
                        ENTRY_TYPE_TEXT_COLOR[entry.entryType] ?? "text-ink"
                      )}
                    >
                      {ENTRY_TYPE_LABEL[entry.entryType] ?? entry.entryType}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "py-3 text-right font-mono",
                      entry.creditDelta < 0 ? "text-down" : entry.creditDelta > 0 ? "text-up" : "text-muted"
                    )}
                  >
                    {entry.creditDelta > 0 ? "+" : ""}
                    {entry.creditDelta.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-body">
                    {entry.costUsd > 0 ? formatExtractionCost(entry.costUsd) : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate py-3 text-sm text-body">{entry.note ?? "—"}</TableCell>
                  <TableCell className="py-3 text-sm text-muted">{entry.createdBy ?? "—"}</TableCell>
                  <TableCell className="py-3 pr-4 text-right text-sm text-muted">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {detail.ledger.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted">
                    No credit activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <StoreDangerZoneCard storeId={detail.storeId} storeName={detail.storeName} />
    </div>
  );
}
