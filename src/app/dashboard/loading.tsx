import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-5">
      <Skeleton className="h-14 w-full max-w-md rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-28 rounded-lg lg:col-span-8" />
        <Skeleton className="h-28 rounded-lg lg:col-span-4" />
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-48 rounded-lg lg:col-span-8" />
        <Skeleton className="h-48 rounded-lg lg:col-span-4" />
      </div>
    </div>
  );
}
