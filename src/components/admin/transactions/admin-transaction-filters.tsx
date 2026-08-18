"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X, RotateCcw, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface StoreOption {
  id: string;
  name: string;
}

export function AdminTransactionFilters({
  stores,
}: {
  stores: StoreOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const qFromUrl = searchParams.get("q") ?? "";
  const storeId = searchParams.get("storeId") ?? "";
  const direction = searchParams.get("direction") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const sourceType = searchParams.get("sourceType") ?? "";
  const dateRange = searchParams.get("dateRange") ?? "30d";

  const [q, setQ] = useState(qFromUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQ(qFromUrl);
  }, [qFromUrl]);

  function updateFilter(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    // Reset page to 1 when changing any filter
    params.delete("page");

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || (key === "dateRange" && value === "30d")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    startTransition(() => {
      router.push(params.toString() ? `/admin/transactions?${params.toString()}` : "/admin/transactions");
    });
  }

  function handleSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFilter({ q: value || null });
    }, 300);
  }

  function resetAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQ("");
    startTransition(() => {
      router.push("/admin/transactions");
    });
  }

  const hasActiveFilters = Boolean(
    q || storeId || direction || category || status || sourceType || (dateRange && dateRange !== "30d")
  );

  return (
    <div className="space-y-3 rounded-2xl border border-hairline bg-canvas p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search ref #, customer name, phone, notes..."
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 text-sm"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                updateFilter({ q: null });
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Date Range Tabs / Dropdown */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            <Calendar className="size-3.5" /> Period:
          </span>
          {[
            { id: "today", label: "Today" },
            { id: "7d", label: "7D" },
            { id: "30d", label: "30D" },
            { id: "90d", label: "90D" },
            { id: "all", label: "All" },
          ].map((item) => {
            const active = dateRange === item.id || (!dateRange && item.id === "30d");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => updateFilter({ dateRange: item.id === "30d" ? null : item.id })}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-surface-soft text-body hover:bg-surface-strong hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 items-center">
        {/* Store filter */}
        <select
          value={storeId}
          onChange={(e) => updateFilter({ storeId: e.target.value || null })}
          className="h-9 rounded-lg border border-hairline bg-canvas px-2.5 text-xs text-body focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Direction filter */}
        <select
          value={direction}
          onChange={(e) => updateFilter({ direction: e.target.value || null })}
          className="h-9 rounded-lg border border-hairline bg-canvas px-2.5 text-xs text-body focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All directions</option>
          <option value="receive">Receive (Cash In)</option>
          <option value="send">Send (Cash Out)</option>
        </select>

        {/* Category filter */}
        <select
          value={category}
          onChange={(e) => updateFilter({ category: e.target.value || null })}
          className="h-9 rounded-lg border border-hairline bg-canvas px-2.5 text-xs text-body focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All categories</option>
          <option value="cash_in">Cash in</option>
          <option value="cash_out">Cash out</option>
          <option value="load">Load</option>
          <option value="bills">Bills</option>
          <option value="other">Other</option>
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => updateFilter({ status: e.target.value || null })}
          className="h-9 rounded-lg border border-hairline bg-canvas px-2.5 text-xs text-body focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="needs_review">Needs review</option>
        </select>

        {/* Source filter */}
        <select
          value={sourceType}
          onChange={(e) => updateFilter({ sourceType: e.target.value || null })}
          className="h-9 rounded-lg border border-hairline bg-canvas px-2.5 text-xs text-body focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All sources</option>
          <option value="screenshot">Screenshot (OCR)</option>
          <option value="statement">Statement</option>
          <option value="manual">Manual entry</option>
        </select>

        {/* Reset button */}
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetAll}
            className="h-9 text-xs text-muted hover:text-ink col-span-2 sm:col-span-1"
          >
            <RotateCcw className="mr-1 size-3.5" />
            Reset filters
          </Button>
        ) : (
          <div className="hidden lg:block text-xs text-muted text-right">
            {isPending ? "Filtering..." : ""}
          </div>
        )}
      </div>
    </div>
  );
}
