"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requirePortalCustomer } from "@/lib/portal/customer-context";
import { db } from "@/db/client";
import { getProcessForOrg } from "@/lib/data/processes";
import {
  createDocumentForOrg,
  DOCUMENT_TYPE_LABEL,
  timelineTitleForClientUpload,
  type DocumentType,
} from "@/lib/data/documents";
import { createTimelineEvent } from "@/lib/data/timeline";
import {
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  isAcceptableMime,
  storage,
} from "@/lib/storage";
import {
  dispatchNotification,
  resolveBrokerAdmins,
} from "@/lib/notifications/dispatch";
import { rateLimit } from "@/lib/rate-limit";
import { notifications, type notificationKind } from "@/db/schema/notifications";
import { orgMembers } from "@/db/schema/organizations";

type NotificationKind = (typeof notificationKind.enumValues)[number];

export type DocumentFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

const typeSchema = z.enum(["invoice", "packing_list", "bl", "di", "receipt", "other"]);

function validateFile(file: unknown): { ok: true; file: File } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecione um arquivo." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `Arquivo maior que ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` };
  }
  if (!isAcceptableMime(file.type || "application/octet-stream")) {
    return { ok: false, error: "Tipo de arquivo não permitido." };
  }
  return { ok: true, file };
}

export async function requestUpdateAction(processId: string, impersonateId?: string): Promise<void> {
  const { session, customers, customerIds, impersonating } = await requirePortalCustomer(impersonateId);
  if (impersonating) {
    throw new Error("Não disponível no modo preview.");
  }

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc || !customerIds.includes(proc.customerId)) {
    throw new Error("Processo não encontrado.");
  }
  const procCustomer = customers.find((c) => c.id === proc.customerId)!;

  const recipients = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, session.orgId),
        eq(orgMembers.role, "broker_admin"),
      ),
    );

  if (recipients.length === 0) return;

  const kind: NotificationKind = "client_requested_update";
  await db.insert(notifications).values(
    recipients.map((r) => ({
      orgId: session.orgId,
      userId: r.userId,
      kind,
      payload: {
        processId,
        processReference: proc.reference,
        customerId: procCustomer.id,
        customerName: procCustomer.legalName,
        requestedAt: new Date().toISOString(),
      },
    })),
  );

  revalidatePath(`/portal/processes/${processId}`);
}

export async function clientUploadDocumentAction(
  processId: string,
  impersonateId: string | undefined,
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const { session, customers, customerIds, impersonating } = await requirePortalCustomer(impersonateId);
  if (impersonating) {
    return { error: "Não disponível no modo preview." };
  }

  if (!rateLimit({ bucket: `portal-upload:${session.userId}`, max: 10, windowMs: 60_000 })) {
    return { error: "Muitos uploads em pouco tempo. Tente novamente em instantes." };
  }

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc || !customerIds.includes(proc.customerId) || proc.deletedAt) {
    return { error: "Processo não encontrado." };
  }
  const procCustomer = customers.find((c) => c.id === proc.customerId)!;

  const typeParse = typeSchema.safeParse(formData.get("type"));
  if (!typeParse.success) return { fieldErrors: { type: ["Tipo inválido."] } };

  const fileCheck = validateFile(formData.get("file"));
  if (!fileCheck.ok) return { fieldErrors: { file: [fileCheck.error] } };

  const docId = randomUUID();
  const filename = fileCheck.file.name;
  const mimeType = fileCheck.file.type || "application/octet-stream";
  const sizeBytes = fileCheck.file.size;
  const storageKey = buildStorageKey(session.orgId, processId, docId, filename);

  const buffer = Buffer.from(await fileCheck.file.arrayBuffer());
  await storage().put(storageKey, buffer, mimeType);

  await createDocumentForOrg(session.orgId, {
    processId,
    type: typeParse.data as DocumentType,
    filename,
    storageKey,
    mimeType,
    sizeBytes,
    status: "pending_review",
    uploadedBy: session.userId,
  });

  await createTimelineEvent({
    orgId: session.orgId,
    processId,
    title: timelineTitleForClientUpload(typeParse.data as DocumentType, filename),
    source: "system",
    actorId: session.userId,
  });

  const recipients = await resolveBrokerAdmins(session.orgId);
  if (recipients.length > 0) {
    await dispatchNotification({
      orgId: session.orgId,
      kind: "doc_added_by_client",
      payload: {
        processId,
        processReference: proc.reference,
        customerId: procCustomer.id,
        customerName: procCustomer.legalName,
        filename,
        docType: DOCUMENT_TYPE_LABEL[typeParse.data as DocumentType],
      },
      recipients,
    });
  }

  revalidatePath(`/portal/processes/${processId}`);
  revalidatePath(`/app/processes/${processId}`);
  return { success: true };
}
