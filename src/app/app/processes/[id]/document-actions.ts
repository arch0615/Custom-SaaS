"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { getProcessForOrg } from "@/lib/data/processes";
import {
  createDocumentForOrg,
  getDocumentForOrg,
  markDocumentReplaced,
  softDeleteDocumentForOrg,
  timelineTitleForDelete,
  timelineTitleForReplace,
  timelineTitleForUpload,
  type DocumentType,
} from "@/lib/data/documents";
import { createTimelineEvent } from "@/lib/data/timeline";
import {
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  isAcceptableMime,
  storage,
} from "@/lib/storage";

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

export async function uploadDocumentAction(
  processId: string,
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const proc = await getProcessForOrg(session.orgId, processId);
  if (!proc) return { error: "Processo não encontrado." };

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
    status: "active",
    uploadedBy: session.userId,
  });

  await createTimelineEvent({
    orgId: session.orgId,
    processId,
    title: timelineTitleForUpload(typeParse.data as DocumentType, filename),
    source: "system",
    actorId: session.userId,
  });

  revalidatePath(`/app/processes/${processId}`);
  return { success: true };
}

export async function replaceDocumentAction(
  processId: string,
  documentId: string,
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const session = await requireSession();
  if (session.role === "client") return { error: "Sem permissão." };

  const old = await getDocumentForOrg(session.orgId, documentId);
  if (!old || old.processId !== processId) return { error: "Documento não encontrado." };

  const fileCheck = validateFile(formData.get("file"));
  if (!fileCheck.ok) return { fieldErrors: { file: [fileCheck.error] } };

  const docId = randomUUID();
  const filename = fileCheck.file.name;
  const mimeType = fileCheck.file.type || "application/octet-stream";
  const sizeBytes = fileCheck.file.size;
  const storageKey = buildStorageKey(session.orgId, processId, docId, filename);

  const buffer = Buffer.from(await fileCheck.file.arrayBuffer());
  await storage().put(storageKey, buffer, mimeType);

  const created = await createDocumentForOrg(session.orgId, {
    processId,
    type: old.type,
    filename,
    storageKey,
    mimeType,
    sizeBytes,
    status: "active",
    uploadedBy: session.userId,
  });

  await markDocumentReplaced(session.orgId, old.id, created.id);

  await createTimelineEvent({
    orgId: session.orgId,
    processId,
    title: timelineTitleForReplace(old.type, filename),
    note: `Substituído: ${old.filename}`,
    source: "system",
    actorId: session.userId,
  });

  revalidatePath(`/app/processes/${processId}`);
  return { success: true };
}

export async function deleteDocumentAction(processId: string, documentId: string): Promise<void> {
  const session = await requireSession();
  if (session.role === "client") throw new Error("Sem permissão.");

  const doc = await getDocumentForOrg(session.orgId, documentId);
  if (!doc || doc.processId !== processId) throw new Error("Documento não encontrado.");

  const result = await softDeleteDocumentForOrg(session.orgId, documentId, session.userId);
  if (!result) throw new Error("Documento já removido.");

  await createTimelineEvent({
    orgId: session.orgId,
    processId,
    title: timelineTitleForDelete(doc.type, doc.filename),
    source: "system",
    actorId: session.userId,
  });

  revalidatePath(`/app/processes/${processId}`);
}
