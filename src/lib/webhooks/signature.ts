import { createHmac, timingSafeEqual } from "node:crypto";

export function computeWebhookSignature(secret: string, rawBody: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(secret: string, rawBody: string, headerValue: string | null): boolean {
  if (!secret || !headerValue) return false;
  const expected = computeWebhookSignature(secret, rawBody);
  const provided = headerValue.replace(/^sha256=/i, "").trim();
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
