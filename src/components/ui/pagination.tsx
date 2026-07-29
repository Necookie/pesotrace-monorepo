import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Builds a compact page-number window: always first & last, the current page
 * with a neighbor on each side, and "…" gaps where pages are skipped. Returns
 * page numbers interleaved with "gap" markers.
 */
function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("gap");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("gap");

  items.push(total);
  return items;
}

const linkClass =
  "flex h-9 min-w-9 items-center justify-center rounded-pill border border-hairline px-3 text-sm font-medium transition-colors";

/**
 * Numbered page navigation. Server-rendered — `makeHref` maps a 1-based page
 * number to the URL for that page (callers preserve their own filters).
 */
export function Pagination({
  currentPage,
  totalPages,
  makeHref,
}: {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {hasPrev ? (
        <Link href={makeHref(currentPage - 1)} className={cn(linkClass, "text-body hover:bg-surface-strong hover:text-ink")} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "cursor-not-allowed text-muted opacity-50")} aria-disabled>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageItems(currentPage, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="flex h-9 min-w-9 items-center justify-center text-sm text-muted">
            …
          </span>
        ) : item === currentPage ? (
          <span
            key={item}
            aria-current="page"
            className={cn(linkClass, "border-primary bg-primary text-primary-foreground")}
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={makeHref(item)}
            className={cn(linkClass, "text-body hover:bg-surface-strong hover:text-ink")}
          >
            {item}
          </Link>
        )
      )}

      {hasNext ? (
        <Link href={makeHref(currentPage + 1)} className={cn(linkClass, "text-body hover:bg-surface-strong hover:text-ink")} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClass, "cursor-not-allowed text-muted opacity-50")} aria-disabled>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
