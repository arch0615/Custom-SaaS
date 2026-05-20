import { CardListSkeleton } from "@/components/skeletons/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalLoading() {
  return (
    <div className="mx-auto w-full space-y-6 px-6 py-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CardListSkeleton rows={3} />
    </div>
  );
}
