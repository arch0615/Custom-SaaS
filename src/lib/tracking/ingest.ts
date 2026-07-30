import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { processes } from "@/db/schema/processes";
import { trackingSubscriptions } from "@/db/schema/tracking";
import { timelineEvents } from "@/db/schema/timeline";
import { inferStageFromEventTitle, shouldAutoAdvance } from "./stage-map";
import { STAGE_LABEL } from "@/lib/process-status";
import type { TrackingProvider, TrackingRefKind } from "@/lib/data/tracking-types";

/**
 * Um evento canônico de rastreamento. Tanto o webhook quanto o refresh
 * (poll) do SeaRates chegam nesta shape antes de virar linha na timeline.
 */
export type TrackingEventInput = {
  provider: TrackingProvider;
  /** ID único NO PROVEDOR pra deduplicação. Formato livre — o unique index
   * `timeline_events.provider_ref` garante idempotência. */
  externalId: string;
  refKind: TrackingRefKind;
  externalRef: string;
  occurredAt: Date;
  title: string;
  note?: string | null;
};

export type IngestResult = {
  accepted: number;
  duplicates: number;
  matched: number;
  advanced: number;
};

/**
 * Aplica UM evento a TODOS os subscriptions que casam com (provider, refKind,
 * externalRef). Escreve timeline (com onConflictDoNothing por providerRef)
 * e opcionalmente avança a etapa do processo se o título indicar transição.
 *
 * Idempotente: repetir o mesmo evento incrementa `duplicates`, não `accepted`.
 */
export async function ingestTrackingEvent(
  event: TrackingEventInput,
): Promise<IngestResult> {
  const subs = await db
    .select({
      id: trackingSubscriptions.id,
      orgId: trackingSubscriptions.orgId,
      processId: trackingSubscriptions.processId,
    })
    .from(trackingSubscriptions)
    .where(
      and(
        eq(trackingSubscriptions.provider, event.provider),
        eq(trackingSubscriptions.refKind, event.refKind),
        eq(trackingSubscriptions.externalRef, event.externalRef),
      ),
    );

  if (subs.length === 0) {
    return { accepted: 0, duplicates: 0, matched: 0, advanced: 0 };
  }

  const candidateStage = inferStageFromEventTitle(event.title);
  let accepted = 0;
  let duplicates = 0;
  let advanced = 0;

  for (const sub of subs) {
    const inserted = await db
      .insert(timelineEvents)
      .values({
        orgId: sub.orgId,
        processId: sub.processId,
        title: event.title,
        note: event.note ?? null,
        source: "auto",
        providerRef: `${event.provider}:${event.externalId}`,
        actorId: null,
        occurredAt: event.occurredAt,
      })
      .onConflictDoNothing()
      .returning({ id: timelineEvents.id });

    if (inserted.length === 0) {
      duplicates += 1;
      continue;
    }

    accepted += 1;

    await db
      .update(trackingSubscriptions)
      .set({ lastEventAt: event.occurredAt })
      .where(eq(trackingSubscriptions.id, sub.id));

    if (candidateStage) {
      const [proc] = await db
        .select({ orgId: processes.orgId, stage: processes.stage })
        .from(processes)
        .where(eq(processes.id, sub.processId))
        .limit(1);
      if (
        proc &&
        proc.orgId === sub.orgId &&
        shouldAutoAdvance(proc.stage, candidateStage)
      ) {
        await db
          .update(processes)
          .set({ stage: candidateStage, updatedAt: sql`now()` })
          .where(eq(processes.id, sub.processId));
        await db.insert(timelineEvents).values({
          orgId: sub.orgId,
          processId: sub.processId,
          title: `Etapa avançada automaticamente para ${STAGE_LABEL[candidateStage]}`,
          note: `Via rastreamento ${event.provider}`,
          source: "system",
          fromStage: proc.stage,
          toStage: candidateStage,
          actorId: null,
        });
        advanced += 1;
      }
    }
  }

  return { accepted, duplicates, matched: subs.length, advanced };
}
