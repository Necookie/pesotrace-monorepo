"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, Download } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatExtractionCost, formatDateTime, formatRelativeTime } from "@/lib/format";
import { CreditUsageChart } from "@/components/charts/lazy";
import { StoreRowDeleteButton } from "@/components/admin/store-row-delete-button";
import { StoreQuickActionsMenu } from "@/components/admin/store-quick-actions-menu";
import { QuickAdjustCreditsDialog } from "@/components/admin/quick-adjust-credits-dialog";
import { BulkGrantCreditsDialog } from "@/components/admin/bulk-grant-credits-dialog";
import { FeeConfigBadge } from "@/components/admin/fee-config-badge";
import { StoreSearch } from "@/components/admin/store-search";
import { SortableHeader } from "@/components/admin/sortable-header";
import { StoreStatusBadge } from "@/components/admin/store-status-badge";
import { StoreHealthBadge } from "@/components/admin/admin-health-badge";
import { downloadStoresCsv } from "@/lib/admin-export";
import type { AdminStoreRow } from "@/lib/queries/admin";

export function StoresOverviewTable({
  stores,
  query,
  activeSort,
  activeDir,
  headerParamsString,
}: {
  stores: AdminStoreRow[];
  query: string;
  activeSort: string;
  activeDir: "asc" | "desc";
  headerParamsString: string;
}) {
  const headerParams = new URLSearchParams(headerParamsString);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "out_of_credits" | "low_credits" | "active" | "suspended">("all");

  const outOfCreditsCount = stores.filter((s) => !s.suspended && s.balance <= 0).length;
  const lowCreditsCount = stores.filter((s) => !s.suspended && s.balance > 0 && s.balance <= 10).length;
  const activeCount = stores.filter((s) => !s.suspended && s.balance > 10).length;
  const suspendedCount = stores.filter((s) => s.suspended).length;

  const visibleStores = stores.filter((s) => {
    if (filterTab === "suspended") return s.suspended;
    if (filterTab === "out_of_credits") return !s.suspended && s.balance <= 0;
    if (filterTab === "low_credits") return !s.suspended && s.balance > 0 && s.balance <= 10;
    if (filterTab === "active") return !s.suspended && s.balance > 10;
    return true;
  });

  const allSelected = visibleStores.length > 0 && selected.size === visibleStores.length;
  const someSelected = selected.size > 0 && !allSelected;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(visibleStores.map((s) => s.storeId)));
  }

  const selectedStores = visibleStores.filter((s) => selected.has(s.storeId));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setFilterTab("all"); setSelected(new Set()); }}
            className={cn(
              "rounded-pill px-3 py-1 text-xs font-medium transition-colors",
              filterTab === "all"
                ? "bg-surface-strong text-ink shadow-sm"
                : "text-muted hover:text-ink"
            )}
          >
            All <span className="text-muted">({stores.length})</span>
          </button>
          {outOfCreditsCount > 0 && (
            <button
              type="button"
              onClick={() => { setFilterTab("out_of_credits"); setSelected(new Set()); }}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-medium transition-colors",
                filterTab === "out_of_credits"
                  ? "bg-rose-500/15 text-rose-700 font-semibold"
                  : "text-rose-600 hover:bg-rose-500/10"
              )}
            >
              Out of credits ({outOfCreditsCount})
            </button>
          )}
          {lowCreditsCount > 0 && (
            <button
              type="button"
              onClick={() => { setFilterTab("low_credits"); setSelected(new Set()); }}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-medium transition-colors",
                filterTab === "low_credits"
                  ? "bg-amber-500/15 text-amber-700 font-semibold"
                  : "text-amber-600 hover:bg-amber-500/10"
              )}
            >
              Low credits ({lowCreditsCount})
            </button>
          )}
          {suspendedCount > 0 && (
            <button
              type="button"
              onClick={() => { setFilterTab("suspended"); setSelected(new Set()); }}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-medium transition-colors",
                filterTab === "suspended"
                  ? "bg-down/15 text-down font-semibold"
                  : "text-muted hover:text-ink"
              )}
            >
              Suspended ({suspendedCount})
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <Wallet className="mr-1.5 size-3.5" />
              Grant credits to {selected.size}
            </Button>
          )}
          <button
            type="button"
            onClick={() => downloadStoresCsv(visibleStores)}
            title="Export filtered list as CSV"
            aria-label="Export stores as CSV"
            className="flex size-8 items-center justify-center rounded-pill border border-hairline text-muted hover:bg-surface-strong hover:text-ink"
          >
            <Download className="size-4" />
          </button>
          <StoreSearch />
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-hairline md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 py-3 pl-4">
                <Checkbox checked={allSelected} indeterminate={someSelected} onCheckedChange={toggleAll} aria-label="Select all stores" />
              </TableHead>
              <TableHead className="py-3">
                <SortableHeader label="Store" sortKey="name" activeSort={activeSort} activeDir={activeDir} searchParams={headerParams} />
              </TableHead>
              <TableHead className="py-3">Health</TableHead>
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
              <TableHead className="w-20 py-3 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleStores.map((store) => (
              <TableRow
                key={store.storeId}
                className={cn((store.balance <= 0 || store.suspended) && "border-l-2 border-l-down bg-down/5")}
              >
                <TableCell className="py-3 pl-4">
                  <Checkbox
                    checked={selected.has(store.storeId)}
                    onCheckedChange={() => toggleOne(store.storeId)}
                    aria-label={`Select ${store.storeName}`}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <Link href={`/admin/stores/${store.storeId}`} className="font-medium text-ink hover:text-primary">
                    {store.storeName}
                  </Link>
                  {store.suspended && <StoreStatusBadge status="suspended" />}
                  {store.balance <= 0 && <StoreStatusBadge status="out_of_credits" />}
                  {store.usageAnomaly && <StoreStatusBadge status="spike" />}
                </TableCell>
                <TableCell className="py-3">
                  <StoreHealthBadge store={store} />
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
                <TableCell
                  className="py-3 text-right text-sm text-muted"
                  title={store.lastActivityAt ? formatDateTime(store.lastActivityAt) : undefined}
                >
                  {formatRelativeTime(store.lastActivityAt)}
                </TableCell>
                <TableCell className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <QuickAdjustCreditsDialog storeId={store.storeId} storeName={store.storeName} />
                    <StoreQuickActionsMenu storeId={store.storeId} storeName={store.storeName} />
                    <StoreRowDeleteButton storeId={store.storeId} storeName={store.storeName} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visibleStores.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-10 text-center text-muted">
                  {filterTab !== "all" ? `No stores match the ${filterTab.replace(/_/g, " ")} filter.` : query ? `No stores match "${query}".` : "No stores yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {visibleStores.map((store) => (
          <div
            key={store.storeId}
            className={cn(
              "rounded-2xl border border-hairline p-4",
              (store.balance <= 0 || store.suspended) && "border-l-2 border-l-down bg-down/5"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex size-11 shrink-0 items-center justify-center">
                  <Checkbox
                    checked={selected.has(store.storeId)}
                    onCheckedChange={() => toggleOne(store.storeId)}
                    aria-label={`Select ${store.storeName}`}
                  />
                </div>
                <div className="min-w-0 pt-2.5">
                  <Link
                    href={`/admin/stores/${store.storeId}`}
                    className="font-medium text-ink hover:text-primary"
                  >
                    {store.storeName}
                  </Link>
                  {store.suspended && <StoreStatusBadge status="suspended" />}
                  {store.balance <= 0 && <StoreStatusBadge status="out_of_credits" />}
                  {store.usageAnomaly && <StoreStatusBadge status="spike" />}
                  <div className="mt-1">
                    <StoreHealthBadge store={store} />
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <QuickAdjustCreditsDialog storeId={store.storeId} storeName={store.storeName} />
                <StoreRowDeleteButton storeId={store.storeId} storeName={store.storeName} />
              </div>
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
              <p
                className="text-xs text-muted"
                title={store.lastActivityAt ? formatDateTime(store.lastActivityAt) : undefined}
              >
                {formatRelativeTime(store.lastActivityAt)}
              </p>
            </div>
          </div>
        ))}
        {stores.length === 0 && (
          <div className="rounded-2xl border border-hairline py-10 text-center text-muted">
            {query ? `No stores match "${query}".` : "No stores yet."}
          </div>
        )}
      </div>

      <BulkGrantCreditsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        storeIds={[...selected]}
        storeNames={selectedStores.map((s) => s.storeName)}
        onDone={() => setSelected(new Set())}
      />
    </div>
  );
}
