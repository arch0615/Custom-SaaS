# Tracking provider integration

Phase 2 of Aduanasync supports automatic process tracking via external
providers. The pipeline is split in two halves:

```
┌──────────────────────┐  subscribe()    ┌──────────────────┐
│  Broker selects      │ ───────────────►│  Provider        │
│  "Adicionar          │                 │  (SeaRates etc.) │
│  rastreamento"       │ ◄───────────────│                  │
│  na UI               │  webhook events │                  │
└──────────────────────┘                 └──────────────────┘
        │                                       │
        │ DB write                              │ POST /api/webhooks/tracking
        ▼                                       ▼
┌──────────────────────────────────────────────────────────┐
│ tracking_subscriptions                                   │
│ timeline_events (source=auto)                            │
│ processes.stage (auto-advanced via stage-map regex)      │
└──────────────────────────────────────────────────────────┘
```

The broker UI lives at `/app/processes/[id]` → tab **Rastreamento**.

## Providers

Implementations live in `src/lib/tracking/providers/`:

| Provider | File | Status |
|---|---|---|
| `manual` | `manual.ts` | ✅ no-op — used for demos + the simulator CLI |
| `searates` | `searates.ts` | 🟡 skeleton — needs `SEARATES_API_KEY` and a 5-min docs check |
| `vizion` | — | ⏳ not implemented (falls back to manual) |

Adding a new provider:
1. Implement `TrackingProviderClient` from `src/lib/tracking/providers/index.ts`
2. Register it in `registry.ts`
3. Add the enum value to `src/db/schema/tracking.ts` + migration

## SeaRates setup checklist

When you have a SeaRates account:

1. **Generate the API key** at
   <https://www.searates.com/dashboard> → Settings → API
2. **Configure the webhook** in the SeaRates dashboard:
   - URL: `https://aduanasync.com.br/api/webhooks/tracking`
   - Secret: the value of `TRACKING_WEBHOOK_SECRET` in your `.env`
   - Method: POST, Content-Type: application/json
3. **Set env vars** in `.env`:
   ```bash
   SEARATES_API_KEY="sr_..."
   SEARATES_BASE_URL="https://tracking.searates.com/api"
   ```
4. **Verify the request shape** in `src/lib/tracking/providers/searates.ts` —
   the file ships with `TODO(searates-docs)` markers on the spots that may
   need adjustment once you can read the live API reference:
   - subscribe endpoint path (`POST /tracking`?)
   - request body field names (`number`/`type` vs `tracking_number`/`carrier`)
   - response id extraction (`id`, `tracking_id`, or `data.id`)
   - unsubscribe verb (DELETE vs POST to `/tracking/cancel`)
5. **Test end-to-end:**
   - In `/app/processes/<id>` → Rastreamento, add a real container number
     with provider = `searates`. The server action will:
       1. POST to SeaRates → expects a subscription id back
       2. INSERT into `tracking_subscriptions` with that id stored in
          `provider_subscription_id`
   - SeaRates pushes events back to `/api/webhooks/tracking`
   - The webhook validates HMAC, writes a `timeline_events` row, and the
     stage-map advances the process stage automatically when the event title
     matches a known pattern (see `src/lib/tracking/stage-map.ts`).

If the broker removes the subscription, the action calls
`provider.unsubscribe()` which DELETEs the upstream subscription.

## Behavior when no key is configured

- The broker UI still lists `SeaRates` and `Vizion` in the provider dropdown.
- Selecting `SeaRates` without `SEARATES_API_KEY` set → action returns
  `{ error: "SEARATES_API_KEY ausente no .env..." }` and nothing is written.
- Selecting `Manual` always works and is the recommended choice for demos.
  Use `scripts/simulate-tracking-event.ts` to push events at the webhook
  directly — same code path that real providers use.

## Cost considerations

SeaRates charges per-tracked-shipment. As of writing:
- Pay-as-you-go: ~$0.30–$0.80 per container/month
- Annual plans available for higher volumes

To avoid runaway bills, consider:
- Per-org cap on `tracking_subscriptions` (not yet enforced; backlog item)
- Auto-cancel subscriptions when `processes.stage = 'pago'` (released +
  paid — no need to keep tracking)
