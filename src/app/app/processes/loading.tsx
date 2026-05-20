import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons/page-skeletons";

export default function ProcessesLoading() {
  return (
    <div className="mx-auto w-full space-y-6 px-6 py-4">
      <PageHeaderSkeleton withAction />
      <TableSkeleton cols={6} rows={6} />
    </div>
  );
}
