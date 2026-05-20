import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthlyPoint } from "./monthly-chart.client";

export type { MonthlyPoint } from "./monthly-chart.client";

const ChartClient = dynamic(() => import("./monthly-chart.client"), {
  loading: () => <Skeleton className="h-72 w-full" />,
});

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const total = data.reduce((acc, d) => acc + d.opened + d.closed, 0);
  if (total === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-stone-500">
        Sem dados nos últimos meses.
      </div>
    );
  }
  return <ChartClient data={data} />;
}
