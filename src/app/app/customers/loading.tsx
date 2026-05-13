import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons/page-skeletons";

export default function CustomersLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <PageHeaderSkeleton withAction />
      <TableSkeleton cols={5} rows={6} />
    </div>
  );
}
