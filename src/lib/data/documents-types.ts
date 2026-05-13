export type DocumentType = "invoice" | "packing_list" | "bl" | "di" | "receipt" | "other";
export type DocumentStatus = "active" | "pending_review" | "replaced" | "deleted";

export const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  "invoice",
  "packing_list",
  "bl",
  "di",
  "receipt",
  "other",
];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  invoice: "Invoice",
  packing_list: "Packing List",
  bl: "BL / AWB",
  di: "DI / DUE",
  receipt: "Comprovante",
  other: "Outros",
};

export const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPE_ORDER.map((value) => ({
  value,
  label: DOCUMENT_TYPE_LABEL[value],
}));

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function timelineTitleForUpload(type: DocumentType, filename: string): string {
  return `Documento ${DOCUMENT_TYPE_LABEL[type]} adicionado: ${filename}`;
}

export function timelineTitleForReplace(type: DocumentType, filename: string): string {
  return `Documento ${DOCUMENT_TYPE_LABEL[type]} substituído: ${filename}`;
}

export function timelineTitleForDelete(type: DocumentType, filename: string): string {
  return `Documento ${DOCUMENT_TYPE_LABEL[type]} removido: ${filename}`;
}
