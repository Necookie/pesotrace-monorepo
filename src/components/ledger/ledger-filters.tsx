"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABELS } from "@/lib/schemas/transaction";
import { cn } from "@/lib/utils";

export function LedgerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/ledger?${params.toString()}`));
  }

  const direction = searchParams.get("direction");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search transactions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && updateParam("search", search || null)}
        className="w-full sm:max-w-xs"
      />
      <div className="flex gap-1">
        {["send", "receive"].map((d) => (
          <button
            key={d}
            onClick={() => updateParam("direction", direction === d ? null : d)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-sm font-medium capitalize",
              direction === d ? "bg-surface-strong text-primary" : "text-body"
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => updateParam("category", category === value ? null : value)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-sm font-medium",
              category === value ? "bg-surface-strong text-primary" : "text-body"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {[
          { value: "needs_review", label: "Needs review" },
          { value: "confirmed", label: "Confirmed" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => updateParam("status", status === s.value ? null : s.value)}
            className={cn(
              "rounded-pill px-3 py-1.5 text-sm font-medium",
              status === s.value ? "bg-surface-strong text-primary" : "text-body"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
