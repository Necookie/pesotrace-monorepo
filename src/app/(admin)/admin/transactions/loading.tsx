import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTransactionsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-96 rounded-lg" />
      </div>

      {/* KPI Tiles skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-hairline bg-canvas p-4">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="mt-2 h-7 w-28 rounded" />
            <Skeleton className="mt-2 h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-72 lg:col-span-2 rounded-2xl border border-hairline bg-canvas p-4">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="mt-4 h-52 w-full rounded-xl" />
        </div>
        <div className="h-72 rounded-2xl border border-hairline bg-canvas p-4">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="mt-4 h-52 w-full rounded-xl" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="h-24 rounded-2xl border border-hairline bg-canvas p-4">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="h-96 rounded-2xl border border-hairline bg-canvas p-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
