import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons/page-skeletons";

export default function ProcessesLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <PageHeaderSkeleton withAction />
      <TableSkeleton cols={6} rows={6} />
    </div>
  );
}
