import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet, Zap, CalendarDays } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStoreCreditDetail,
  listStoreFeeChanges,
  getStoreTransactionsWithReceipts,
} from "@/lib/queries/admin";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreditUsageChart, RequestVolumeChart } from "@/components/charts/lazy";
import { AdjustCreditsForm } from "@/components/admin/adjust-credits-form";
import { RenameStoreForm } from "@/components/admin/rename-store-form";
import { StoreDangerZoneCard } from "@/components/admin/store-danger-zone-card";
import { StoreFeeConfigCard } from "@/components/admin/store-fee-config-card";
import { StoreFeeSummary } from "@/components/admin/store-fee-summary";
import { StoreFeeHistory } from "@/components/admin/store-fee-history";
import { StoreReceiptVerification } from "@/components/admin/store-receipt-verification";
import { DEFAULT_FEE_TIER_CONFIG } from "@/lib/schemas/fee-tier";
import { AdminKpiTile } from "@/components/admin/admin-kpi-tile";

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

const LEDGER_PAGE_SIZE = 200;
const RECEIPT_PAGE_SIZE = 12;

export default async function AdminStoreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ledgerOffset?: string; receiptOffset?: string }>;
}) {
  const { id } = await params;
  const { ledgerOffset: ledgerOffsetParam, receiptOffset: receiptOffsetParam } =
    await searchParams;
  const ledgerOffset = Math.max(0, Number(ledgerOffsetParam) || 0);
  const receiptOffset = Math.max(0, Number(receiptOffsetParam) || 0);

  const supabase = createAdminClient();
  const detail = await getStoreCreditDetail(supabase, id, ledgerOffset);

  if (!detail) notFound();

  const [{ data: store }, feeChanges, receipts] = await Promise.all([
    supabase.from("stores").select("fee_tier_config, fee_formula").eq("id", id).maybeSingle(),
    listStoreFeeChanges(supabase, id),
    getStoreTransactionsWithReceipts(supabase, id, RECEIPT_PAGE_SIZE, receiptOffset),
  ]);

  const receiptMoreParams = new URLSearchParams();
  receiptMoreParams.set("receiptOffset", String(receiptOffset + RECEIPT_PAGE_SIZE));
  if (ledgerOffset) receiptMoreParams.set("ledgerOffset", String(ledgerOffset));

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
        <AdminKpiTile
          label="Credit balance"
          value={detail.balance.toLocaleString()}
          icon={Wallet}
          accent={detail.balance <= 0 ? "down" : "up"}
        />
        <AdminKpiTile label="Requests today" value={String(detail.requestsToday)} icon={Zap} accent="primary" />
        <AdminKpiTile
          label="Requests this week"
          value={String(detail.requestsThisWeek)}
          icon={CalendarDays}
          accent="primary"
        />
      </div>

      <StoreReceiptVerification
        rows={receipts.rows}
        hasMore={receipts.hasMore}
        moreHref={`/admin/stores/${detail.storeId}?${receiptMoreParams.toString()}`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <RenameStoreForm storeId={detail.storeId} currentName={detail.storeName} />
        <AdjustCreditsForm storeId={detail.storeId} />
      </div>

      <StoreFeeSummary
        config={{
          tiers: store?.fee_tier_config ?? DEFAULT_FEE_TIER_CONFIG,
          formula: store?.fee_formula,
        }}
      />

      <StoreFeeConfigCard
        storeId={detail.storeId}
        initialTiers={store?.fee_tier_config ?? DEFAULT_FEE_TIER_CONFIG}
        initialFormula={store?.fee_formula ?? null}
      />

      <StoreFeeHistory changes={feeChanges} />

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

        {/* Desktop: table */}
        <div className="hidden overflow-hidden rounded-2xl border border-hairline md:block">
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

        {/* Mobile: stacked cards */}
        <div className="flex flex-col gap-3 md:hidden">
          {detail.ledger.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-hairline p-4">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "inline-block rounded-pill bg-surface-strong px-2.5 py-1 text-xs font-medium",
                    ENTRY_TYPE_TEXT_COLOR[entry.entryType] ?? "text-ink"
                  )}
                >
                  {ENTRY_TYPE_LABEL[entry.entryType] ?? entry.entryType}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm",
                    entry.creditDelta < 0 ? "text-down" : entry.creditDelta > 0 ? "text-up" : "text-muted"
                  )}
                >
                  {entry.creditDelta > 0 ? "+" : ""}
                  {entry.creditDelta.toLocaleString()}
                </span>
              </div>
              {entry.note && <p className="mt-2 text-sm text-body">{entry.note}</p>}
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{entry.createdBy ?? "—"}</span>
                <span>{formatDateTime(entry.createdAt)}</span>
              </div>
              {entry.costUsd > 0 && (
                <p className="mt-1 font-mono text-xs text-muted">Real cost {formatExtractionCost(entry.costUsd)}</p>
              )}
            </div>
          ))}
          {detail.ledger.length === 0 && (
            <div className="rounded-2xl border border-hairline py-10 text-center text-muted">
              No credit activity yet.
            </div>
          )}
        </div>

        {detail.ledgerHasMore && (
          <div className="mt-4 flex justify-center">
            <Link
              href={`/admin/stores/${detail.storeId}?ledgerOffset=${ledgerOffset + LEDGER_PAGE_SIZE}`}
              className="rounded-pill border border-hairline px-4 py-2 text-sm font-medium text-body hover:bg-surface-strong hover:text-ink"
            >
              Load more
            </Link>
          </div>
        )}
      </div>

      <StoreDangerZoneCard storeId={detail.storeId} storeName={detail.storeName} />
    </div>
  );
}
