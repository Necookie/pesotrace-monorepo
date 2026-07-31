"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const SEARCH_DEBOUNCE_MS = 300;

/** Filters the admin stores table by name via a debounced ?q= URL param. */
export function StoreSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [q, setQ] = useState(qFromUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function pushQuery(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    router.push(params.toString() ? `/admin?${params.toString()}` : "/admin");
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
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input
        placeholder="Search stores..."
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-8 pr-8"
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
