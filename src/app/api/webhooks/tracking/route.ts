import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { verifyWebhookSignature } from "@/lib/webhooks/signature";
import { rateLimit } from "@/lib/rate-limit";
import { ingestTrackingEvent } from "@/lib/tracking/ingest";

const eventSchema = z.object({
  provider: z.enum(["searates", "vizion", "manual"]),
  external_id: z.string().trim().min(1).max(255),
  ref_kind: z.enum(["container", "bl", "awb", "booking"]),
  external_ref: z.string().trim().min(1).max(64),
  occurred_at: z.iso.datetime(),
  title: z.string().trim().min(1).max(255),
  note: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get("x-forwarded-for") ?? "anonymous";
  const allowed = rateLimit({ bucket: `webhook:tracking:${clientIp}`, max: 60, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const secret = process.env.TRACKING_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_secret_not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-tracking-signature");
  if (!verifyWebhookSignature(secret, raw, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventsInput = Array.isArray(body) ? body : [body];
  const parsed = z.array(eventSchema).safeParse(eventsInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  let totalAccepted = 0;
  let totalDuplicates = 0;
  let totalUnmatched = 0;
  let totalAdvanced = 0;
  for (const e of parsed.data) {
    const result = await ingestTrackingEvent({
      provider: e.provider,
      externalId: e.external_id,
      refKind: e.ref_kind,
      externalRef: e.external_ref,
      occurredAt: new Date(e.occurred_at),
      title: e.title,
      note: e.note ?? null,
    });
    totalAccepted += result.accepted;
    totalDuplicates += result.duplicates;
    totalAdvanced += result.advanced;
    if (result.matched === 0) totalUnmatched += 1;
  }

  return NextResponse.json({
    accepted: totalAccepted,
    duplicates: totalDuplicates,
    unmatched: totalUnmatched,
    advanced: totalAdvanced,
  });
}
