import { LocalDriver } from "./local";

export interface StorageDriver {
  put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; size: number }>;
  delete(key: string): Promise<void>;
}

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (driver) return driver;
  // Future: switch on STORAGE_DRIVER env var to S3 driver.
  driver = new LocalDriver(process.env.STORAGE_LOCAL_DIR ?? ".storage");
  return driver;
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const FORBIDDEN_MIME = new Set([
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-sh",
  "application/x-bat",
]);

export function isAcceptableMime(mime: string): boolean {
  if (!mime) return false;
  if (FORBIDDEN_MIME.has(mime)) return false;
  if (mime.startsWith("application/x-executable")) return false;
  return true;
}

export function sanitizeFilename(name: string): string {
  const base = name.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const cleaned = base.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned.length > 0 ? cleaned.slice(0, 200) : "arquivo";
}

export function buildStorageKey(orgId: string, processId: string, docId: string, filename: string): string {
  return `org/${orgId}/process/${processId}/${docId}-${sanitizeFilename(filename)}`;
}
