import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Skeleton className="h-8 w-60" />
      <Skeleton className="h-12 w-full rounded-pill sm:w-96" />
      <Skeleton className="mt-4 h-52 rounded-2xl" />
    </div>
  );
}
