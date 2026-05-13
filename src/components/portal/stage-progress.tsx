import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_LABEL, STAGE_ORDER, stageIndex } from "@/lib/process-status";
import type { ProcessStage } from "@/lib/data/processes";

export function StageProgress({ current }: { current: ProcessStage }) {
  const currentIdx = stageIndex(current);

  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STAGE_ORDER.map((stage, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "todo";
        return (
          <li key={stage} className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-foreground bg-foreground text-background",
                  state === "todo" && "border-border bg-card text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  state === "todo" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {STAGE_LABEL[stage]}
              </span>
            </div>
            <div
              className={cn(
                "h-1 w-full rounded-full",
                state === "todo" ? "bg-muted" : state === "current" ? "bg-foreground" : "bg-primary",
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
