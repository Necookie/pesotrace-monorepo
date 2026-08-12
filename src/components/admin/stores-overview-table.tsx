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
import { QuickAdjustCreditsDialog } from "@/components/admin/quick-adjust-credits-dialog";
import { BulkGrantCreditsDialog } from "@/components/admin/bulk-grant-credits-dialog";
import { FeeConfigBadge } from "@/components/admin/fee-config-badge";
import { StoreSearch } from "@/components/admin/store-search";
import { SortableHeader } from "@/components/admin/sortable-header";
import { StoreStatusBadge } from "@/components/admin/store-status-badge";
import type { AdminStoreRow } from "@/lib/queries/admin";

function exportStoresCsv(stores: AdminStoreRow[]) {
  const headers = ["Store", "Status", "Credit balance", "Requests today", "Extractions (30d)", "Real cost (30d)", "Last activity"];
  const rows = stores.map((s) => [
    s.storeName,
    s.suspended ? "Suspended" : s.balance <= 0 ? "Out of credits" : "Active",
    String(s.balance),
    String(s.requestsToday),
    String(s.extractionsThisMonth),
    formatExtractionCost(s.costUsdThisMonth),
    s.lastActivityAt ? formatDateTime(s.lastActivityAt) : "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stores-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  const [suspendedOnly, setSuspendedOnly] = useState(false);

  const visibleStores = suspendedOnly ? stores.filter((s) => s.suspended) : stores;

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
  const suspendedCount = stores.filter((s) => s.suspended).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          {suspendedOnly ? "Suspended stores" : "All stores"}{" "}
          <span className="font-normal text-muted">({visibleStores.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <Wallet className="mr-1.5 size-3.5" />
              Grant credits to {selected.size}
            </Button>
          )}
          {suspendedCount > 0 && (
            <button
              type="button"
              onClick={() => { setSuspendedOnly(!suspendedOnly); setSelected(new Set()); }}
              className={cn(
                "rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors",
                suspendedOnly
                  ? "border-down/50 bg-down/10 text-down"
                  : "border-hairline text-muted hover:border-ink/30 hover:text-ink"
              )}
            >
              {suspendedOnly ? "Show all" : `Suspended (${suspendedCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => exportStoresCsv(visibleStores)}
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
                  <div className="flex items-center justify-end">
                    <QuickAdjustCreditsDialog storeId={store.storeId} storeName={store.storeName} />
                    <StoreRowDeleteButton storeId={store.storeId} storeName={store.storeName} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visibleStores.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-muted">
                  {suspendedOnly ? "No suspended stores." : query ? `No stores match "${query}".` : "No stores yet."}
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
