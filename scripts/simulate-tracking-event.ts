import "dotenv/config";
import { createHmac, randomUUID } from "node:crypto";

/**
 * Push a tracking event to /api/webhooks/tracking, signed with the same secret
 * that the route validates. Use this to simulate provider pushes during demos
 * and end-to-end tests without paying for SeaRates/Vizion.
 *
 * Examples:
 *
 *   pnpm tsx scripts/simulate-tracking-event.ts --ref MSCU1234567 \
 *     --title "Container embarcado em Shanghai"
 *
 *   pnpm tsx scripts/simulate-tracking-event.ts --ref HBL-2026-0151 \
 *     --kind bl --provider searates \
 *     --title "Carga descarregada no porto de Santos" --note "MSC Bruxelles"
 *
 *   pnpm tsx scripts/simulate-tracking-event.ts --ref MSCU1234567 \
 *     --title "Customs cleared" --url http://localhost:3000
 */

type Args = {
  ref: string;
  kind: "container" | "bl" | "awb" | "booking";
  provider: "manual" | "searates" | "vizion";
  title: string;
  note: string | null;
  occurredAt: string;
  url: string;
};

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {
    kind: "container",
    provider: "manual",
    note: null,
    occurredAt: new Date().toISOString(),
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--ref") args.ref = v;
    else if (k === "--kind") args.kind = v as Args["kind"];
    else if (k === "--provider") args.provider = v as Args["provider"];
    else if (k === "--title") args.title = v;
    else if (k === "--note") args.note = v;
    else if (k === "--occurred-at") args.occurredAt = v;
    else if (k === "--url") args.url = v;
  }
  if (!args.ref || !args.title) {
    console.error(
      "Usage: pnpm tsx scripts/simulate-tracking-event.ts --ref <external_ref> --title <title>\n" +
        "  [--kind container|bl|awb|booking] [--provider manual|searates|vizion]\n" +
        "  [--note <note>] [--occurred-at <ISO>] [--url <base>]",
    );
    process.exit(1);
  }
  return args as Args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const secret = process.env.TRACKING_WEBHOOK_SECRET;
  if (!secret) {
    console.error("TRACKING_WEBHOOK_SECRET not set in .env");
    process.exit(1);
  }

  const body = JSON.stringify({
    provider: args.provider,
    external_id: `sim_${randomUUID()}`,
    ref_kind: args.kind,
    external_ref: args.ref.toUpperCase(),
    occurred_at: args.occurredAt,
    title: args.title,
    note: args.note,
  });

  const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  const res = await fetch(`${args.url.replace(/\/$/, "")}/api/webhooks/tracking`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Tracking-Signature": signature },
    body,
  });

  const text = await res.text();
  console.log(`HTTP ${res.status} ← ${args.url}`);
  console.log(text);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
