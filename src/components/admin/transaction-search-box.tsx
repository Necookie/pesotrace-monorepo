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
    <div className="relative w-full sm:max-w-md">
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
  );
}
