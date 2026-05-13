import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons/page-skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <PageHeaderSkeleton />
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-12">
            {[4, 4, 2, 2].map((span, i) => (
              <div key={i} className={`space-y-2 sm:col-span-${span}`}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <TableSkeleton cols={5} rows={4} />
        </CardContent>
      </Card>
    </div>
  );
}
