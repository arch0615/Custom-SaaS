import { FormSkeleton } from "@/components/skeletons/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewProcessLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <FormSkeleton sections={5} />
    </div>
  );
}
