import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { trackingSubscriptions } from "@/db/schema/tracking";
import type {
  TrackingProvider,
  TrackingRefKind,
  TrackingSubscriptionRow,
} from "./tracking-types";

export type {
  TrackingProvider,
  TrackingRefKind,
  TrackingSubscriptionRow,
} from "./tracking-types";
export {
  TRACKING_PROVIDER_LABEL,
  TRACKING_REF_KIND_LABEL,
} from "./tracking-types";

export async function listTrackingForProcess(
  orgId: string,
  processId: string,
): Promise<TrackingSubscriptionRow[]> {
  return db
    .select({
      id: trackingSubscriptions.id,
      processId: trackingSubscriptions.processId,
      provider: trackingSubscriptions.provider,
      refKind: trackingSubscriptions.refKind,
      externalRef: trackingSubscriptions.externalRef,
      lastPolledAt: trackingSubscriptions.lastPolledAt,
      lastEventAt: trackingSubscriptions.lastEventAt,
      disabled: trackingSubscriptions.disabled,
      createdAt: trackingSubscriptions.createdAt,
    })
    .from(trackingSubscriptions)
    .where(
      and(
        eq(trackingSubscriptions.orgId, orgId),
        eq(trackingSubscriptions.processId, processId),
      ),
    )
    .orderBy(desc(trackingSubscriptions.createdAt));
}

export async function createTrackingSubscription(input: {
  orgId: string;
  processId: string;
  provider: TrackingProvider;
  refKind: TrackingRefKind;
  externalRef: string;
  providerSubscriptionId?: string | null;
}) {
  const [row] = await db
    .insert(trackingSubscriptions)
    .values(input)
    .onConflictDoNothing()
    .returning({ id: trackingSubscriptions.id });
  return row ?? null;
}

export async function getTrackingSubscription(orgId: string, id: string) {
  const [row] = await db
    .select({
      id: trackingSubscriptions.id,
      processId: trackingSubscriptions.processId,
      provider: trackingSubscriptions.provider,
      refKind: trackingSubscriptions.refKind,
      externalRef: trackingSubscriptions.externalRef,
    })
    .from(trackingSubscriptions)
    .where(and(eq(trackingSubscriptions.orgId, orgId), eq(trackingSubscriptions.id, id)))
    .limit(1);
  return row ?? null;
}

export async function markTrackingPolled(id: string) {
  await db
    .update(trackingSubscriptions)
    .set({ lastPolledAt: new Date() })
    .where(eq(trackingSubscriptions.id, id));
}

export async function deleteTrackingSubscription(orgId: string, id: string) {
  const [row] = await db
    .delete(trackingSubscriptions)
    .where(
      and(eq(trackingSubscriptions.orgId, orgId), eq(trackingSubscriptions.id, id)),
    )
    .returning({
      id: trackingSubscriptions.id,
      provider: trackingSubscriptions.provider,
      providerSubscriptionId: trackingSubscriptions.providerSubscriptionId,
    });
  return row ?? null;
}
