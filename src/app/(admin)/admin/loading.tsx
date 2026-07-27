import { Skeleton } from "@/components/ui/skeleton";

/**
 * Covers every admin route (overview, store detail, audit, admins) via the
 * nearest-boundary rule, so navigating into a store's detail — which runs
 * several aggregation queries — paints immediately instead of hanging on the
 * previous page.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
