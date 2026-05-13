import { CircleDot, Sparkles, User, Cog } from "lucide-react";
import type { TimelineEventRow } from "@/lib/data/timeline";
import { STAGE_LABEL } from "@/lib/process-status";
import { Badge } from "@/components/ui/badge";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function SourceIcon({ source }: { source: TimelineEventRow["source"] }) {
  if (source === "auto") return <Sparkles className="size-4 text-blue-600" />;
  if (source === "system") return <Cog className="size-4 text-muted-foreground" />;
  return <User className="size-4 text-foreground" />;
}

export function TimelineView({ events }: { events: TimelineEventRow[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum evento ainda. As atualizações aparecerão aqui em ordem cronológica.
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l pl-6">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[33px] mt-1.5 flex size-5 items-center justify-center rounded-full border-2 border-background bg-card ring-1 ring-border">
            <CircleDot className="size-3 text-muted-foreground" />
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <SourceIcon source={e.source} />
              <span className="font-medium">{e.title}</span>
              {e.nonSequential && (
                <Badge variant="outline" className="text-xs">Pulou etapas</Badge>
              )}
            </div>
            {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
            {(e.fromStage || e.toStage) && (
              <p className="text-xs text-muted-foreground">
                {e.fromStage ? STAGE_LABEL[e.fromStage] : "início"}{" "}
                → {e.toStage ? STAGE_LABEL[e.toStage] : "—"}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {dateTimeFmt.format(e.occurredAt)}
              {e.actorName ? <> · {e.actorName}</> : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
