"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { parseProcessForm } from "@/lib/validation/process";
import {
  getProcessByReference,
  getProcessForOrg,
  softDeleteProcessForOrg,
  updateProcessForOrg,
  type ProcessStage,
} from "@/lib/data/processes";
import { getCustomerForOrg } from "@/lib/data/customers";
import { createTimelineEvent } from "@/lib/data/timeline";
import { STAGE_LABEL, isStageJump } from "@/lib/process-status";
import {
  dispatchNotification,
  resolveCustomerClientUsers,
} from "@/lib/notifications/dispatch";

export type ProcessFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const stageSchema = z.enum([
  "docs_received",
  "shipment",
  "in_transit",
  "customs",
  "released",
  "delivered",
]);

export async function updateProcessAction(
  id: string,
  _prev: ProcessFormState,
  formData: FormData,
): Promise<ProcessFormState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const existing = await getProcessForOrg(session.orgId, id);
  if (!existing) return { error: "Processo não encontrado." };

  const parsed = parseProcessForm(formData);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  const customer = await getCustomerForOrg(session.orgId, data.customerId);
  if (!customer) return { fieldErrors: { customerId: ["Cliente inválido."] } };

  if (data.reference !== existing.reference) {
    const dup = await getProcessByReference(session.orgId, data.reference);
    if (dup && dup.id !== id && !dup.deletedAt) {
      return { fieldErrors: { reference: ["Outra referência igual já existe."] } };
    }
  }

  await updateProcessForOrg(session.orgId, id, data);

  revalidatePath("/app/processes");
  revalidatePath(`/app/processes/${id}`);
  return {};
}

export async function advanceStageAction(id: string, formData: FormData) {
  const session = await requireSession();
  if (session.role === "client") throw new Error("Sem permissão.");

  const parsedStage = stageSchema.safeParse(formData.get("stage"));
  if (!parsedStage.success) throw new Error("Etapa inválida.");
  const toStage: ProcessStage = parsedStage.data;

  const existing = await getProcessForOrg(session.orgId, id);
  if (!existing) throw new Error("Processo não encontrado.");

  if (existing.stage === toStage) return;

  const note = ((formData.get("note") as string | null) ?? "").trim() || null;

  await updateProcessForOrg(session.orgId, id, { stage: toStage });

  const jump = isStageJump(existing.stage, toStage);
  await createTimelineEvent({
    orgId: session.orgId,
    processId: id,
    title: `Etapa alterada: ${STAGE_LABEL[existing.stage]} → ${STAGE_LABEL[toStage]}`,
    note,
    source: "system",
    fromStage: existing.stage,
    toStage,
    nonSequential: jump,
    actorId: session.userId,
  });

  const recipients = await resolveCustomerClientUsers(session.orgId, existing.customerId);
  if (recipients.length > 0) {
    await dispatchNotification({
      orgId: session.orgId,
      kind: "stage_advanced",
      payload: {
        processId: id,
        processReference: existing.reference,
        stageLabel: STAGE_LABEL[toStage],
        toStage,
      },
      recipients,
    });
  }

  revalidatePath("/app/processes");
  revalidatePath(`/app/processes/${id}`);
}

export async function deleteProcessAction(id: string) {
  const session = await requireSession();
  if (session.role === "client") throw new Error("Sem permissão.");

  await softDeleteProcessForOrg(session.orgId, id);

  revalidatePath("/app/processes");
  redirect("/app/processes");
}
