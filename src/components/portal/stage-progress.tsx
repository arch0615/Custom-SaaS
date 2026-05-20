import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_LABEL, STAGE_ORDER, stageIndex } from "@/lib/process-status";
import type { ProcessStage } from "@/lib/data/processes";

export function StageProgress({ current }: { current: ProcessStage }) {
  const currentIdx = stageIndex(current);
  const total = STAGE_ORDER.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium">
          Etapa atual: <span className="text-foreground">{STAGE_LABEL[current]}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          ({currentIdx + 1} de {total})
        </span>
      </div>

      <ol className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 sm:flex-wrap sm:overflow-visible">
        {STAGE_ORDER.map((stage, i) => {
          const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "todo";
          return (
            <li
              key={stage}
              className={cn(
                "flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                state === "done" && "border-primary bg-primary/10 text-primary",
                state === "current" && "border-foreground bg-foreground text-background",
                state === "todo" && "border-border bg-card text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[10px] font-medium leading-none",
                  state === "done" && "bg-primary text-primary-foreground",
                  state === "current" && "bg-background text-foreground",
                  state === "todo" && "bg-muted text-muted-foreground",
                )}
              >
                {state === "done" ? <Check className="size-2.5" /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{STAGE_LABEL[stage]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
