import { Skeleton } from "@/components/ui/skeleton";
import { AdminKpiGridSkeleton } from "@/components/admin/admin-kpi-tile-skeleton";

/**
 * Covers every admin route (overview, store detail, audit, admins) via the
 * nearest-boundary rule, so navigating into a store's detail — which runs
 * several aggregation queries — paints immediately instead of hanging on the
 * previous page.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <AdminKpiGridSkeleton count={6} />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
