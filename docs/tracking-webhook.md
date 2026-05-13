# Auto-tracking webhook contract

Phase 2 integrates a cargo-tracking aggregator (SeaRates or Vizion). This file
documents the public contract today so we can plug in either provider without
touching the timeline UI.

## Endpoint

`POST /api/webhooks/tracking`

- Content-Type: `application/json`
- Header `X-Tracking-Signature: sha256=<hex>` — HMAC-SHA256 of the **raw**
  request body, using `process.env.TRACKING_WEBHOOK_SECRET`. The `sha256=`
  prefix is optional.
- The route is rate-limited to 60 requests per minute per source IP.

### Response codes

| Code | Meaning                                                        |
|------|----------------------------------------------------------------|
| 200  | Payload accepted (body returns acceptance counts)              |
| 400  | JSON parse failed or payload schema invalid                    |
| 401  | Missing or invalid signature                                   |
| 429  | Rate-limit exceeded for this source                            |
| 503  | `TRACKING_WEBHOOK_SECRET` is not configured (deployment issue) |

200 body shape:

```json
{ "accepted": 3, "duplicates": 1, "unmatched": 0 }
```

- `accepted` — events written to `timeline_events`.
- `duplicates` — events skipped because the same `provider:external_id` was
  already stored (idempotent on retries).
- `unmatched` — events that did not match any active subscription.

## Payload

A single event or an array of events. Each event:

```json
{
  "provider": "searates",
  "external_id": "evt_abc123",
  "ref_kind": "container",
  "external_ref": "MSCU1234567",
  "occurred_at": "2026-05-13T14:32:00Z",
  "title": "Carga descarregada no porto de Santos",
  "note": "Detalhes opcionais"
}
```

| Field         | Type    | Required | Notes                                              |
|---------------|---------|----------|----------------------------------------------------|
| provider      | enum    | yes      | `searates` \| `vizion` \| `manual`                 |
| external_id   | string  | yes      | Provider-side event id. Drives idempotency.        |
| ref_kind      | enum    | yes      | `container` \| `bl` \| `awb` \| `booking`          |
| external_ref  | string  | yes      | The thing being tracked (e.g. `MSCU1234567`).      |
| occurred_at   | ISO-8601| yes      | UTC. Drives chronological order in the timeline.   |
| title         | string  | yes      | Shown verbatim on the timeline.                    |
| note          | string  | no       | Optional sub-line.                                 |

## Idempotency

The endpoint computes `provider_ref = "${provider}:${external_id}"` and stores
it on the inserted `timeline_events` row. The DB has a partial unique index
on `provider_ref WHERE provider_ref IS NOT NULL`, so re-delivering the same
event is a no-op. Providers can retry safely.

## Subscriptions

Each tracked process has rows in `tracking_subscriptions`:

```
( id, org_id, process_id, provider, ref_kind, external_ref,
  last_polled_at, last_event_at, disabled, created_at )
```

The webhook matches every subscription that shares `(provider, ref_kind, external_ref)`.
A single container number could legitimately be on subscriptions in multiple
orgs (different despachantes), and each gets its own copy of the event.

Subscriptions are created by the despachante when they wire a container/BL/AWB
to a process — this UI doesn't exist yet (Phase 2). For now insert by hand:

```sql
INSERT INTO tracking_subscriptions (org_id, process_id, provider, ref_kind, external_ref)
SELECT p.org_id, p.id, 'searates', 'container', 'MSCU1234567'
FROM processes p WHERE p.reference = 'P-2026-0001';
```

## Signing requests (for the provider)

Compute the hex digest of `HMAC_SHA256(secret, raw_body)` and send it in
`X-Tracking-Signature`. Example (Node):

```ts
import { createHmac } from "node:crypto";

const secret = process.env.TRACKING_WEBHOOK_SECRET!;
const body = JSON.stringify(events);
const signature = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

await fetch("https://app.customs-saas.com/api/webhooks/tracking", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Tracking-Signature": signature },
  body,
});
```

## Local testing

```bash
SECRET=$(grep '^TRACKING_WEBHOOK_SECRET=' .env | cut -d= -f2- | tr -d '"')
BODY='[{"provider":"searates","external_id":"evt_1","ref_kind":"container","external_ref":"MSCU1234567","occurred_at":"2026-05-13T14:32:00Z","title":"Saída do porto","note":null}]'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/api/webhooks/tracking \
  -H "Content-Type: application/json" \
  -H "X-Tracking-Signature: sha256=$SIG" \
  --data "$BODY"
```

## Roadmap (Phase 2 changes)

- UI to manage `tracking_subscriptions` from the process detail page.
- Polling fallback (cron) for providers that don't push.
- Map `provider` → human label in the timeline ("Atualizado via SeaRates").
- Per-org cap on tracked refs to avoid runaway aggregator bills.
