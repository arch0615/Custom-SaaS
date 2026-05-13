import { mkdir, writeFile, stat, unlink, readFile } from "node:fs/promises";
import { join, dirname, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import type { StorageDriver } from "./index";

export class LocalDriver implements StorageDriver {
  private readonly root: string;
  private readonly metaSuffix = ".meta.json";

  constructor(rootDir: string) {
    this.root = resolve(rootDir);
  }

  private resolveSafe(key: string): string {
    const target = resolve(join(this.root, key));
    if (!target.startsWith(this.root + sep) && target !== this.root) {
      throw new Error("Storage key escapes root directory");
    }
    return target;
  }

  async put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<void> {
    const target = this.resolveSafe(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data);
    await writeFile(target + this.metaSuffix, JSON.stringify({ contentType }));
  }

  async get(key: string) {
    const target = this.resolveSafe(key);
    const [info, meta] = await Promise.all([
      stat(target),
      readFile(target + this.metaSuffix, "utf8").catch(() => "{}"),
    ]);
    const buf = await readFile(target);
    const stream = Readable.toWeb(Readable.from(buf)) as ReadableStream<Uint8Array>;
    const parsed = JSON.parse(meta) as { contentType?: string };
    return {
      stream,
      contentType: parsed.contentType ?? "application/octet-stream",
      size: info.size,
    };
  }

  async delete(key: string): Promise<void> {
    const target = this.resolveSafe(key);
    await Promise.all([
      unlink(target).catch(() => undefined),
      unlink(target + this.metaSuffix).catch(() => undefined),
    ]);
  }
}
