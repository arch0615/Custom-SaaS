import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { StagesBarPoint } from "./stages-bar-chart-types";

export type { StagesBarPoint } from "./stages-bar-chart-types";

const ChartClient = dynamic(() => import("./stages-bar-chart.client"), {
  loading: () => <Skeleton className="h-56 w-full" />,
});

export function StagesBarChart({ data }: { data: StagesBarPoint[] }) {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sem dados para exibir.
      </div>
    );
  }
  return <ChartClient data={data} />;
}
