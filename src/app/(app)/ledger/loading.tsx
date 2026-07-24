import { Skeleton } from "@/components/ui/skeleton";

export default function LedgerLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:space-y-6 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-10 w-28 rounded-pill md:h-8" />
      </div>

      <Skeleton className="h-10 w-full rounded-pill md:h-8" />

      <Skeleton className="h-9 w-52 rounded-pill" />

      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, group) => (
          <div key={group}>
            <Skeleton className="mb-3 h-11 rounded-xl" />
            <div className="flex flex-col gap-3 md:hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="hidden h-48 rounded-2xl md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
