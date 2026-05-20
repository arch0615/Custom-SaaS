"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { getProcessForOrg } from "@/lib/data/processes";
import {
  createTrackingSubscription,
  deleteTrackingSubscription,
} from "@/lib/data/tracking";

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
  if (session.role === "client") return { error: "Sem permissão." };

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) return { error: "Processo não encontrado." };

  const parsed = trackingSchema.safeParse({
    provider: formData.get("provider"),
    refKind: formData.get("refKind"),
    externalRef: (formData.get("externalRef") ?? "").toString().toUpperCase(),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const created = await createTrackingSubscription({
    orgId: session.orgId,
    processId,
    provider: parsed.data.provider,
    refKind: parsed.data.refKind,
    externalRef: parsed.data.externalRef,
  });

  if (!created) {
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
  if (session.role === "client") throw new Error("Sem permissão.");

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) throw new Error("Processo não encontrado.");

  const removed = await deleteTrackingSubscription(session.orgId, subscriptionId);
  if (!removed) throw new Error("Rastreamento não encontrado.");

  revalidatePath(`/app/processes/${processId}`);
}
