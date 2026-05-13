"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { getProcessForOrg } from "@/lib/data/processes";
import {
  createTimelineEvent,
  getTimelineEventForOrg,
  softDeleteTimelineEvent,
} from "@/lib/data/timeline";

export type TimelineFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const addSchema = z.object({
  title: z.string().trim().min(2, "Título obrigatório").max(255),
  note: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  occurredAt: z
    .string()
    .trim()
    .min(1, "Data e hora obrigatórias")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida"),
});

export async function addTimelineEntryAction(
  processId: string,
  _prev: TimelineFormState,
  formData: FormData,
): Promise<TimelineFormState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) return { error: "Processo não encontrado." };

  const parsed = addSchema.safeParse({
    title: formData.get("title"),
    note: formData.get("note") ?? "",
    occurredAt: formData.get("occurredAt"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await createTimelineEvent({
    orgId: session.orgId,
    processId,
    title: parsed.data.title,
    note: parsed.data.note,
    source: "manual",
    actorId: session.userId,
    occurredAt: new Date(parsed.data.occurredAt),
  });

  revalidatePath(`/app/processes/${processId}`);
  return { success: true };
}

export async function deleteTimelineEntryAction(eventId: string): Promise<void> {
  const session = await requireSession();
  if (session.role !== "broker_admin") throw new Error("Sem permissão. Apenas administradores podem remover eventos.");

  const event = await getTimelineEventForOrg(session.orgId, eventId);
  if (!event) throw new Error("Evento não encontrado.");

  const result = await softDeleteTimelineEvent(session.orgId, eventId, session.userId);
  if (!result) throw new Error("Evento não encontrado ou já removido.");

  revalidatePath(`/app/processes/${result.processId}`);
}
