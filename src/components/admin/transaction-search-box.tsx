"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

/** Debounced ?q= search box for the cross-store transaction search page. */
export function TransactionSearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [q, setQ] = useState(qFromUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function pushQuery(value: string) {
    router.push(value ? `/admin/search?q=${encodeURIComponent(value)}` : "/admin/search");
  }

  function handleChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushQuery(value), SEARCH_DEBOUNCE_MS);
  }

  function clear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQ("");
    pushQuery("");
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="w-full sm:max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Reference number, customer name, or phone..."
          value={q}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-8 pr-8"
          autoFocus
        />
        {q && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span>Hints:</span>
        <button
          type="button"
          onClick={() => { setQ("GCASH"); pushQuery("GCASH"); }}
          className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[11px] hover:border-ink/20 hover:text-ink"
        >
          GCASH
        </button>
        <button
          type="button"
          onClick={() => { setQ("09"); pushQuery("09"); }}
          className="rounded-pill border border-hairline px-2 py-0.5 font-mono text-[11px] hover:border-ink/20 hover:text-ink"
        >
          09* (Phone)
        </button>
        <button
          type="button"
          onClick={() => { setQ("Maya"); pushQuery("Maya"); }}
          className="rounded-pill border border-hairline px-2 py-0.5 text-[11px] hover:border-ink/20 hover:text-ink"
        >
          Maya
        </button>
      </div>
    </div>
  );
}
