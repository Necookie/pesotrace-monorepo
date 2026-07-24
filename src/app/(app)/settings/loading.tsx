import { Skeleton } from "@/components/ui/skeleton";

/**
 * Sits inside the settings layout, so the pill nav stays rendered and only the
 * panel body swaps to a skeleton when moving between settings sub-pages.
 */
export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
