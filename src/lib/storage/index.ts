import { LocalDriver } from "./local";
import { S3Driver } from "./s3";

export interface StorageDriver {
  put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; size: number }>;
  delete(key: string): Promise<void>;
}

let driver: StorageDriver | null = null;

function buildDriver(): StorageDriver {
  const choice = (process.env.STORAGE_DRIVER ?? "").toLowerCase();

  if (choice === "s3") {
    const bucket = process.env.S3_BUCKET;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const region = process.env.S3_REGION ?? "auto";
    const endpoint = process.env.S3_ENDPOINT || undefined;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

    if (!bucket || !accessKey || !secretKey) {
      throw new Error(
        "STORAGE_DRIVER=s3 requires S3_BUCKET, S3_ACCESS_KEY and S3_SECRET_KEY",
      );
    }
    return new S3Driver({ bucket, accessKey, secretKey, region, endpoint, forcePathStyle });
  }

  // Default: local filesystem driver (dev / single-server deployments)
  return new LocalDriver(process.env.STORAGE_LOCAL_DIR ?? ".storage");
}

export function storage(): StorageDriver {
  if (driver) return driver;
  driver = buildDriver();
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
