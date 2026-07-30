"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { denyIfMissing, requirePermission } from "@/lib/auth/permissions";
import { getProcessForOrg } from "@/lib/data/processes";
import {
  createTrackingSubscription,
  deleteTrackingSubscription,
  getTrackingSubscription,
  markTrackingPolled,
} from "@/lib/data/tracking";
import { getTrackingProvider } from "@/lib/tracking/providers/registry";
import { TrackingProviderError } from "@/lib/tracking/providers";
import { fetchSearatesSnapshot } from "@/lib/tracking/providers/searates";
import { recordSearatesQuota } from "@/lib/tracking/searates-quota";
import { ingestTrackingEvent } from "@/lib/tracking/ingest";

export type TrackingFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const trackingSchema = z.object({
  provider: z.enum(["manual", "searates", "vizion"]),
  refKind: z.enum(["container", "bl", "awb", "booking"]),
  externalRef: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(64, "Máximo 64 caracteres"),
});

export async function addTrackingSubscriptionAction(
  processId: string,
  _prev: TrackingFormState,
  formData: FormData,
): Promise<TrackingFormState> {
  const session = await requireSession();
  const denied = denyIfMissing(session.role, "tracking:manage"); if (denied) return denied;

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) return { error: "Processo não encontrado." };

  const parsed = trackingSchema.safeParse({
    provider: formData.get("provider"),
    refKind: formData.get("refKind"),
    externalRef: (formData.get("externalRef") ?? "").toString().toUpperCase(),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  // Register with the upstream provider first. If that fails, we don't write
  // a stale DB row that points at a non-existent provider subscription.
  let providerSubscriptionId: string | null = null;
  try {
    const client = getTrackingProvider(parsed.data.provider);
    const result = await client.subscribe({
      refKind: parsed.data.refKind,
      externalRef: parsed.data.externalRef,
    });
    providerSubscriptionId = result.providerSubscriptionId;
  } catch (err) {
    if (err instanceof TrackingProviderError) {
      return { error: err.message };
    }
    return { error: "Falha inesperada ao contatar o provedor de rastreamento." };
  }

  const created = await createTrackingSubscription({
    orgId: session.orgId,
    processId,
    provider: parsed.data.provider,
    refKind: parsed.data.refKind,
    externalRef: parsed.data.externalRef,
    providerSubscriptionId,
  });

  if (!created) {
    // DB unique-conflict: the same ref was already tracked. Roll back the
    // provider subscription we just created so we don't leak orphaned IDs.
    if (providerSubscriptionId) {
      try {
        await getTrackingProvider(parsed.data.provider).unsubscribe({
          providerSubscriptionId,
        });
      } catch {
        /* best-effort cleanup */
      }
    }
    return { error: "Esta referência já está rastreando este processo." };
  }

  revalidatePath(`/app/processes/${processId}`);
  return { success: true };
}

export async function deleteTrackingSubscriptionAction(
  processId: string,
  subscriptionId: string,
): Promise<void> {
  const session = await requireSession();
  requirePermission(session.role, "tracking:manage");

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) throw new Error("Processo não encontrado.");

  const removed = await deleteTrackingSubscription(session.orgId, subscriptionId);
  if (!removed) throw new Error("Rastreamento não encontrado.");

  // Best-effort upstream cancel. We've already deleted the DB row; if the
  // provider call fails the broker can clean it up there manually.
  try {
    await getTrackingProvider(removed.provider).unsubscribe({
      providerSubscriptionId: removed.providerSubscriptionId,
    });
  } catch {
    /* swallow — DB row is already gone */
  }

  revalidatePath(`/app/processes/${processId}`);
}

export type RefreshTrackingResult = {
  accepted: number;
  duplicates: number;
  status: string | null;
};

/**
 * Consulta o provedor AGORA e importa eventos novos. Só SeaRates por
 * enquanto (vizion não implementado, manual não tem upstream).
 *
 * ATENÇÃO: consome quota do SeaRates (1 api_call por chamada, e
 * 1 unique_shipment se for a primeira vez que consultamos o número).
 */
export async function refreshTrackingSubscriptionAction(
  processId: string,
  subscriptionId: string,
): Promise<RefreshTrackingResult> {
  const session = await requireSession();
  requirePermission(session.role, "tracking:manage");

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) throw new Error("Processo não encontrado.");

  const sub = await getTrackingSubscription(session.orgId, subscriptionId);
  if (!sub || sub.processId !== processId) {
    throw new Error("Rastreamento não encontrado.");
  }

  if (sub.provider !== "searates") {
    throw new Error(
      sub.provider === "manual"
        ? "Manual não tem consulta automática — adicione eventos pela Timeline."
        : "Provedor não suporta atualização manual ainda.",
    );
  }

  let snapshot;
  try {
    snapshot = await fetchSearatesSnapshot({
      refKind: sub.refKind,
      externalRef: sub.externalRef,
    });
  } catch (err) {
    if (err instanceof TrackingProviderError) {
      throw new Error(err.message);
    }
    throw err;
  }

  recordSearatesQuota(snapshot.quota);
  await markTrackingPolled(sub.id);

  let accepted = 0;
  let duplicates = 0;
  for (const evt of snapshot.events) {
    // Inclui containerNumber pra evitar colisão: uma mesma BL pode ter
    // vários containers com o mesmo order_id em eventos idênticos.
    const containerKey = evt.containerNumber ?? "x";
    const externalId = evt.orderId
      ? `${sub.externalRef}:${containerKey}:${evt.orderId}`
      : `${sub.externalRef}:${containerKey}:${evt.date}:${evt.description.slice(0, 40)}`;
    const result = await ingestTrackingEvent({
      provider: "searates",
      externalId,
      refKind: sub.refKind,
      externalRef: sub.externalRef,
      occurredAt: new Date(evt.date),
      title: evt.description,
      note: evt.containerNumber ? `Container ${evt.containerNumber}` : null,
    });
    accepted += result.accepted;
    duplicates += result.duplicates;
  }

  revalidatePath(`/app/processes/${processId}`);
  return { accepted, duplicates, status: snapshot.status };
}
