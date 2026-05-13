import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { timelineEvents } from "@/db/schema/timeline";
import { users } from "@/db/schema/auth";
import type { ProcessStage } from "./processes";

export type TimelineEventRow = {
  id: string;
  title: string;
  note: string | null;
  source: "manual" | "auto" | "system";
  fromStage: ProcessStage | null;
  toStage: ProcessStage | null;
  nonSequential: boolean;
  actorId: string | null;
  actorName: string | null;
  occurredAt: Date;
  deletedAt: Date | null;
  deletedById: string | null;
  deletedByName: string | null;
};

const deletedByUsers = sql`(SELECT "id", "name" FROM "users")`;

export async function listTimelineForProcess(orgId: string, processId: string): Promise<TimelineEventRow[]> {
  const rows = await db.execute(sql`
    SELECT
      te.id,
      te.title,
      te.note,
      te.source,
      te.from_stage,
      te.to_stage,
      te.non_sequential,
      te.actor_id,
      actor.name AS actor_name,
      te.occurred_at,
      te.deleted_at,
      te.deleted_by,
      deleter.name AS deleter_name
    FROM timeline_events te
    LEFT JOIN users actor ON actor.id = te.actor_id
    LEFT JOIN users deleter ON deleter.id = te.deleted_by
    WHERE te.org_id = ${orgId}
      AND te.process_id = ${processId}
    ORDER BY te.occurred_at ASC
  `);
  return rows.rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    note: (r.note as string | null) ?? null,
    source: r.source as TimelineEventRow["source"],
    fromStage: (r.from_stage as ProcessStage | null) ?? null,
    toStage: (r.to_stage as ProcessStage | null) ?? null,
    nonSequential: r.non_sequential as boolean,
    actorId: (r.actor_id as string | null) ?? null,
    actorName: (r.actor_name as string | null) ?? null,
    occurredAt: new Date(r.occurred_at as string),
    deletedAt: r.deleted_at ? new Date(r.deleted_at as string) : null,
    deletedById: (r.deleted_by as string | null) ?? null,
    deletedByName: (r.deleter_name as string | null) ?? null,
  }));
}

export async function getTimelineEventForOrg(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(timelineEvents)
    .where(and(eq(timelineEvents.orgId, orgId), eq(timelineEvents.id, id)))
    .limit(1);
  return row ?? null;
}

export async function softDeleteTimelineEvent(orgId: string, id: string, actorId: string) {
  const [row] = await db
    .update(timelineEvents)
    .set({ deletedAt: sql`now()`, deletedBy: actorId })
    .where(
      and(
        eq(timelineEvents.orgId, orgId),
        eq(timelineEvents.id, id),
        isNull(timelineEvents.deletedAt),
      ),
    )
    .returning({ id: timelineEvents.id, processId: timelineEvents.processId });
  return row ?? null;
}

export async function createTimelineEvent(data: {
  orgId: string;
  processId: string;
  title: string;
  note?: string | null;
  source: "manual" | "auto" | "system";
  fromStage?: ProcessStage | null;
  toStage?: ProcessStage | null;
  nonSequential?: boolean;
  actorId: string | null;
  occurredAt?: Date;
}) {
  const [row] = await db
    .insert(timelineEvents)
    .values({
      orgId: data.orgId,
      processId: data.processId,
      title: data.title,
      note: data.note ?? null,
      source: data.source,
      fromStage: data.fromStage ?? null,
      toStage: data.toStage ?? null,
      nonSequential: data.nonSequential ?? false,
      actorId: data.actorId,
      occurredAt: data.occurredAt ?? new Date(),
    })
    .returning({ id: timelineEvents.id });
  return row;
}
