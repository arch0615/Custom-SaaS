import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { processes } from "@/db/schema/processes";
import { trackingSubscriptions } from "@/db/schema/tracking";
import { timelineEvents } from "@/db/schema/timeline";
import { verifyWebhookSignature } from "@/lib/webhooks/signature";
import { rateLimit } from "@/lib/rate-limit";

const eventSchema = z.object({
  provider: z.enum(["searates", "vizion", "manual"]),
  external_id: z.string().trim().min(1).max(255),
  ref_kind: z.enum(["container", "bl", "awb", "booking"]),
  external_ref: z.string().trim().min(1).max(64),
  occurred_at: z.iso.datetime(),
  title: z.string().trim().min(1).max(255),
  note: z.string().trim().max(2000).optional().nullable(),
});

type Event = z.infer<typeof eventSchema>;

async function processEvent(event: Event): Promise<{ accepted: number; duplicates: number; matched: number }> {
  const subs = await db
    .select({
      id: trackingSubscriptions.id,
      orgId: trackingSubscriptions.orgId,
      processId: trackingSubscriptions.processId,
    })
    .from(trackingSubscriptions)
    .where(
      and(
        eq(trackingSubscriptions.provider, event.provider),
        eq(trackingSubscriptions.refKind, event.ref_kind),
        eq(trackingSubscriptions.externalRef, event.external_ref),
      ),
    );

  if (subs.length === 0) return { accepted: 0, duplicates: 0, matched: 0 };

  let accepted = 0;
  let duplicates = 0;
  for (const sub of subs) {
    const inserted = await db
      .insert(timelineEvents)
      .values({
        orgId: sub.orgId,
        processId: sub.processId,
        title: event.title,
        note: event.note ?? null,
        source: "auto",
        providerRef: `${event.provider}:${event.external_id}`,
        actorId: null,
        occurredAt: new Date(event.occurred_at),
      })
      .onConflictDoNothing()
      .returning({ id: timelineEvents.id });

    if (inserted.length > 0) {
      accepted += 1;
      // verify the process still exists & is the same org (defensive)
      const [p] = await db
        .select({ orgId: processes.orgId })
        .from(processes)
        .where(eq(processes.id, sub.processId))
        .limit(1);
      if (!p || p.orgId !== sub.orgId) {
        // would be a stale subscription; not actionable from here
      }
    } else {
      duplicates += 1;
    }
  }

  return { accepted, duplicates, matched: subs.length };
}

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
  for (const e of parsed.data) {
    const result = await processEvent(e);
    totalAccepted += result.accepted;
    totalDuplicates += result.duplicates;
    if (result.matched === 0) totalUnmatched += 1;
  }

  return NextResponse.json({
    accepted: totalAccepted,
    duplicates: totalDuplicates,
    unmatched: totalUnmatched,
  });
}
