import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-80 rounded-lg" />
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-hairline bg-canvas p-4">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="mt-2 h-7 w-24 rounded" />
            <Skeleton className="mt-2 h-3 w-16 rounded" />
          </div>
        ))}
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
