import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder for the dashboard — mirrors the final layout:
 * stat grid, continue-learning cards, chart + upcoming row, announcements.
 */
export function DashboardSkeleton() {
  return (
    <div role="status" className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Stat grid */}
     <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
  <Skeleton className="h-28 rounded-2xl" />
  <Skeleton className="h-28 rounded-2xl" />
  <Skeleton className="h-28 rounded-2xl" />
  <Skeleton className="h-28 rounded-2xl" />
  <Skeleton className="h-28 rounded-2xl" />
   <Skeleton className="h-28 rounded-2xl" />
    <Skeleton className="h-28 rounded-2xl" />
</div>

      {/* Continue learning */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>

      {/* Activity chart + upcoming */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      </div>

      {/* Announcements */}
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
