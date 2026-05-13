import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import type { StorageDriver } from "./index";

export class S3Driver implements StorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(opts: {
    endpoint?: string;
    region: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    forcePathStyle?: boolean;
  }) {
    this.bucket = opts.bucket;
    this.client = new S3Client({
      endpoint: opts.endpoint || undefined,
      region: opts.region,
      credentials: {
        accessKeyId: opts.accessKey,
        secretAccessKey: opts.secretKey,
      },
      forcePathStyle: opts.forcePathStyle ?? !!opts.endpoint,
    });
  }

  async put(key: string, data: Buffer | Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string) {
    const out = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const body = out.Body;
    if (!body) throw new Error(`Empty body for ${key}`);
    const stream = body instanceof Readable
      ? (Readable.toWeb(body) as ReadableStream<Uint8Array>)
      : (body as ReadableStream<Uint8Array>);
    return {
      stream,
      contentType: out.ContentType ?? "application/octet-stream",
      size: Number(out.ContentLength ?? 0),
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
