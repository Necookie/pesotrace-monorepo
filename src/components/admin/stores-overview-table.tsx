"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatExtractionCost, formatDateTime } from "@/lib/format";
import { CreditUsageChart } from "@/components/charts/lazy";
import { StoreRowDeleteButton } from "@/components/admin/store-row-delete-button";
import { QuickAdjustCreditsDialog } from "@/components/admin/quick-adjust-credits-dialog";
import { BulkGrantCreditsDialog } from "@/components/admin/bulk-grant-credits-dialog";
import { FeeConfigBadge } from "@/components/admin/fee-config-badge";
import { StoreSearch } from "@/components/admin/store-search";
import { SortableHeader } from "@/components/admin/sortable-header";
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

  const allSelected = stores.length > 0 && selected.size === stores.length;
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
    setSelected(allSelected ? new Set() : new Set(stores.map((s) => s.storeId)));
  }

  const selectedStores = stores.filter((s) => selected.has(s.storeId));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">
          All stores <span className="font-normal text-muted">({stores.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <Wallet className="mr-1.5 size-3.5" />
              Grant credits to {selected.size}
            </Button>
          )}
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
            {stores.map((store) => (
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
                  {store.suspended && (
                    <span className="ml-2 inline-block rounded-pill bg-down/10 px-2 py-0.5 text-[11px] font-medium text-down">
                      Suspended
                    </span>
                  )}
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
                  <div className="flex items-center justify-end">
                    <QuickAdjustCreditsDialog storeId={store.storeId} storeName={store.storeName} />
                    <StoreRowDeleteButton storeId={store.storeId} storeName={store.storeName} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {stores.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-muted">
                  {query ? `No stores match "${query}".` : "No stores yet."}
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
                  {store.suspended && (
                    <span className="ml-2 inline-block rounded-pill bg-down/10 px-2 py-0.5 text-[11px] font-medium text-down">
                      Suspended
                    </span>
                  )}
                  {store.balance <= 0 && (
                    <span className="ml-2 inline-block rounded-pill bg-surface-strong px-2 py-0.5 text-[11px] font-medium text-down">
                      Out of credits
                    </span>
                  )}
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
              <p className="text-xs text-muted">
                {store.lastActivityAt ? formatDateTime(store.lastActivityAt) : "No activity yet"}
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
