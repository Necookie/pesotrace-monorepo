import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A `<TableHead>` that links to itself with the sort key toggled — clicking
 * an inactive column sorts by it descending; clicking the active column
 * flips direction. Preserves every other query param (search, etc).
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

  return (
    <Link
      href={href}
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
