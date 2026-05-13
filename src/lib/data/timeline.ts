import { and, asc, eq, isNull } from "drizzle-orm";
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
};

export async function listTimelineForProcess(orgId: string, processId: string): Promise<TimelineEventRow[]> {
  return db
    .select({
      id: timelineEvents.id,
      title: timelineEvents.title,
      note: timelineEvents.note,
      source: timelineEvents.source,
      fromStage: timelineEvents.fromStage,
      toStage: timelineEvents.toStage,
      nonSequential: timelineEvents.nonSequential,
      actorId: timelineEvents.actorId,
      actorName: users.name,
      occurredAt: timelineEvents.occurredAt,
    })
    .from(timelineEvents)
    .leftJoin(users, eq(users.id, timelineEvents.actorId))
    .where(
      and(
        eq(timelineEvents.orgId, orgId),
        eq(timelineEvents.processId, processId),
        isNull(timelineEvents.deletedAt),
      ),
    )
    .orderBy(asc(timelineEvents.occurredAt));
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
