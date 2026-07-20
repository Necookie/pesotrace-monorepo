"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABELS } from "@/lib/schemas/transaction";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 400;

export function LedgerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";
  const [search, setSearch] = useState(searchFromUrl);
  // Tracks the searchFromUrl value `search` was last synced to, so an
  // external URL change (e.g. the "Clear filters" link) can be detected and
  // applied during render — React's documented pattern for adjusting state
  // when a prop changes, without the extra render pass a setState-in-effect
  // would cost. A plain useState initializer only runs once and would
  // otherwise leave stale text in the box after such a reset.
  const [syncedSearchFromUrl, setSyncedSearchFromUrl] = useState(searchFromUrl);
  if (searchFromUrl !== syncedSearchFromUrl) {
    setSyncedSearchFromUrl(searchFromUrl);
    setSearch(searchFromUrl);
  }
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/ledger?${params.toString()}`));
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("search", value || null), SEARCH_DEBOUNCE_MS);
  }

  function clearSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch("");
    updateParam("search", null);
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const direction = searchParams.get("direction");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  return (
    <div className="mb-5 flex flex-col gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            updateParam("search", search || null);
          }}
          className="pl-8 pr-8"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-pill border border-hairline p-1">
          {["send", "receive"].map((d) => (
            <button
              key={d}
              onClick={() => updateParam("direction", direction === d ? null : d)}
              className={cn(
                "rounded-pill px-3 py-1.5 text-sm font-medium capitalize transition-all duration-200 hover:shadow-sm",
                direction === d ? "bg-surface-strong text-primary" : "text-body"
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl border border-hairline p-1">
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => updateParam("category", category === value ? null : value)}
              className={cn(
                "rounded-pill px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:shadow-sm",
                category === value ? "bg-surface-strong text-primary" : "text-body"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-pill border border-hairline p-1">
          {[
            { value: "needs_review", label: "Needs review" },
            { value: "confirmed", label: "Confirmed" },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => updateParam("status", status === s.value ? null : s.value)}
              className={cn(
                "rounded-pill px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:shadow-sm",
                status === s.value ? "bg-surface-strong text-primary" : "text-body"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
