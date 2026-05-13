import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { documents } from "@/db/schema/documents";
import {
  DOCUMENT_TYPE_ORDER,
  type DocumentType,
  type DocumentStatus,
} from "./documents-types";

export type {
  DocumentType,
  DocumentStatus,
} from "./documents-types";
export {
  DOCUMENT_TYPE_ORDER,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPE_OPTIONS,
  formatBytes,
  timelineTitleForUpload,
  timelineTitleForReplace,
  timelineTitleForDelete,
} from "./documents-types";

export type DocumentRow = {
  id: string;
  processId: string;
  type: DocumentType;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  replacedBy: string | null;
  uploadedBy: string;
  uploadedByName: string | null;
  uploadedAt: Date;
};

export async function listDocumentsForProcess(orgId: string, processId: string): Promise<DocumentRow[]> {
  const rows = await db.execute(sql`
    SELECT
      d.id,
      d.process_id,
      d.type,
      d.filename,
      d.storage_key,
      d.mime_type,
      d.size_bytes,
      d.status,
      d.replaced_by,
      d.uploaded_by,
      u.name AS uploaded_by_name,
      d.uploaded_at
    FROM documents d
    LEFT JOIN users u ON u.id = d.uploaded_by
    WHERE d.org_id = ${orgId}
      AND d.process_id = ${processId}
      AND d.deleted_at IS NULL
      AND d.status IN ('active', 'pending_review')
    ORDER BY d.uploaded_at DESC
  `);
  return rows.rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    processId: r.process_id as string,
    type: r.type as DocumentType,
    filename: r.filename as string,
    storageKey: r.storage_key as string,
    mimeType: r.mime_type as string,
    sizeBytes: Number(r.size_bytes),
    status: r.status as DocumentStatus,
    replacedBy: (r.replaced_by as string | null) ?? null,
    uploadedBy: r.uploaded_by as string,
    uploadedByName: (r.uploaded_by_name as string | null) ?? null,
    uploadedAt: new Date(r.uploaded_at as string),
  }));
}

export async function getDocumentForOrg(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orgId, orgId), eq(documents.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createDocumentForOrg(orgId: string, data: {
  processId: string;
  type: DocumentType;
  filename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  uploadedBy: string;
}) {
  const [row] = await db
    .insert(documents)
    .values({ orgId, ...data })
    .returning({ id: documents.id });
  return row;
}

export async function markDocumentReplaced(orgId: string, id: string, replacedById: string) {
  const [row] = await db
    .update(documents)
    .set({ status: "replaced", replacedBy: replacedById })
    .where(and(eq(documents.orgId, orgId), eq(documents.id, id)))
    .returning({ id: documents.id });
  return row ?? null;
}

export async function softDeleteDocumentForOrg(orgId: string, id: string, actorId: string) {
  const [row] = await db
    .update(documents)
    .set({ status: "deleted", deletedAt: sql`now()`, deletedBy: actorId })
    .where(and(eq(documents.orgId, orgId), eq(documents.id, id), isNull(documents.deletedAt)))
    .returning({ id: documents.id, processId: documents.processId });
  return row ?? null;
}

export function groupDocumentsByType(rows: DocumentRow[]): Map<DocumentType, DocumentRow[]> {
  const map = new Map<DocumentType, DocumentRow[]>();
  for (const t of DOCUMENT_TYPE_ORDER) map.set(t, []);
  for (const r of rows) map.get(r.type)!.push(r);
  return map;
}
