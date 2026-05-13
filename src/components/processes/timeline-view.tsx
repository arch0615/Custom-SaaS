import { CircleDot, Cog, Sparkles, User } from "lucide-react";
import type { TimelineEventRow } from "@/lib/data/timeline";
import { STAGE_LABEL } from "@/lib/process-status";
import { Badge } from "@/components/ui/badge";
import { DeleteTimelineEventButton } from "@/app/app/processes/[id]/delete-timeline-event-button";

const dayHeaderFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});
const editorFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function startOfDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return startOfDayKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return startOfDayKey(d);
}

function dayLabel(d: Date): string {
  const key = startOfDayKey(d);
  if (key === todayKey()) return "Hoje";
  if (key === yesterdayKey()) return "Ontem";
  return dayHeaderFmt.format(d);
}

function SourceIcon({ source }: { source: TimelineEventRow["source"] }) {
  if (source === "auto") return <Sparkles className="size-4 text-blue-600" />;
  if (source === "system") return <Cog className="size-4 text-muted-foreground" />;
  return <User className="size-4 text-foreground" />;
}

function SourceBadge({ source }: { source: TimelineEventRow["source"] }) {
  if (source === "auto")
    return (
      <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
        Automático
      </Badge>
    );
  if (source === "system")
    return (
      <Badge variant="outline" className="text-xs">
        Sistema
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs">
      Manual
    </Badge>
  );
}

export function TimelineView({
  events,
  canDelete,
}: {
  events: TimelineEventRow[];
  canDelete: boolean;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma atualização ainda. As entradas aparecerão aqui em ordem cronológica.
      </div>
    );
  }

  const groups = new Map<string, { date: Date; rows: TimelineEventRow[] }>();
  for (const e of events) {
    const key = startOfDayKey(e.occurredAt);
    if (!groups.has(key)) groups.set(key, { date: e.occurredAt, rows: [] });
    groups.get(key)!.rows.push(e);
  }

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([key, { date, rows }]) => (
        <section key={key}>
          <div className="sticky top-0 z-10 -mx-2 mb-2 bg-background/90 px-2 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur">
            {dayLabel(date)}
          </div>
          <ol className="relative space-y-4 border-l pl-6">
            {rows.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[33px] top-0.5 flex size-5 items-center justify-center rounded-full border-2 border-background bg-card ring-1 ring-border">
                  <CircleDot className="size-3 text-muted-foreground" />
                </span>
                <div className={`flex flex-col gap-1 ${e.deletedAt ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <SourceIcon source={e.source} />
                    <span className={`font-medium ${e.deletedAt ? "line-through" : ""}`}>{e.title}</span>
                    <SourceBadge source={e.source} />
                    {e.nonSequential && (
                      <Badge variant="outline" className="text-xs">Pulou etapas</Badge>
                    )}
                    {e.deletedAt && (
                      <Badge variant="destructive" className="text-xs">Removido</Badge>
                    )}
                    {!e.deletedAt && canDelete && e.source === "manual" && (
                      <DeleteTimelineEventButton id={e.id} title={e.title} />
                    )}
                  </div>
                  {e.note && !e.deletedAt && (
                    <p className="text-sm text-muted-foreground">{e.note}</p>
                  )}
                  {(e.fromStage || e.toStage) && (
                    <p className="text-xs text-muted-foreground">
                      {e.fromStage ? STAGE_LABEL[e.fromStage] : "início"}{" "}
                      → {e.toStage ? STAGE_LABEL[e.toStage] : "—"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {timeFmt.format(e.occurredAt)}
                    {e.actorName ? <> · {e.actorName}</> : null}
                  </p>
                  {e.deletedAt && (
                    <p className="text-xs italic text-muted-foreground">
                      Removido por {e.deletedByName ?? "usuário"} em {editorFmt.format(e.deletedAt)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
