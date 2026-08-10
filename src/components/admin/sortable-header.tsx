"use client";

import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_STORAGE_KEY = "admin:stores-sort";
const DIR_STORAGE_KEY = "admin:stores-dir";

/**
 * A `<TableHead>` that links to itself with the sort key toggled — clicking
 * an inactive column sorts by it descending; clicking the active column
 * flips direction. Preserves every other query param (search, etc).
 *
 * Also persists the active sort to localStorage so the operator's preferred
 * column order survives a page refresh.
 */
export function SortableHeader({
  label,
  sortKey,
  activeSort,
  activeDir,
  searchParams,
  align = "left",
}: {
  label: string;
  sortKey: string;
  activeSort: string;
  activeDir: "asc" | "desc";
  searchParams: URLSearchParams;
  align?: "left" | "right";
}) {
  const isActive = activeSort === sortKey;
  const nextDir = isActive && activeDir === "desc" ? "asc" : "desc";

  const params = new URLSearchParams(searchParams);
  params.set("sort", sortKey);
  params.set("dir", nextDir);
  const href = `/admin?${params.toString()}`;

  const Icon = isActive ? (activeDir === "desc" ? ArrowDown : ArrowUp) : ArrowUpDown;

  function handleClick() {
    try {
      localStorage.setItem(SORT_STORAGE_KEY, sortKey);
      localStorage.setItem(DIR_STORAGE_KEY, nextDir);
    } catch {
      // localStorage may be unavailable in some browser configurations; ignore.
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 hover:text-ink",
        align === "right" && "flex-row-reverse",
        isActive && "text-ink"
      )}
    >
      {label}
      <Icon className={cn("size-3", !isActive && "opacity-40")} />
    </Link>
  );
}

/** Keys used to persist the active sort preference for the stores table. */
export { SORT_STORAGE_KEY, DIR_STORAGE_KEY };
