# Operations notes

Short field guide for running this app once it's live. Pre-deploy checklist
plus the few things we always forget.

## Environment

Required env vars (see `.env.example`):

| Var | Purpose | Notes |
|-----|---------|-------|
| `DATABASE_URL` | Postgres connection string | Use the managed Postgres host (Neon / Railway / RDS) |
| `AUTH_SECRET` | Auth.js JWT signing | `openssl rand -base64 32` |
| `AUTH_URL` | Public app URL | Used in auth callbacks |
| `AUTH_TRUST_HOST` | `"true"` behind a proxy | Vercel / Fly set this for you |
| `RESEND_API_KEY` | Transactional e-mail | Empty → e-mail no-ops gracefully |
| `EMAIL_FROM` | `From:` header | Must be a verified domain in Resend |
| `S3_*` | Object storage (Phase 2) | Today the local driver writes to `STORAGE_LOCAL_DIR` |
| `STORAGE_LOCAL_DIR` | Dev storage path | Ignored when `STORAGE_DRIVER` is `s3` later |
| `TRACKING_WEBHOOK_SECRET` | HMAC for `/api/webhooks/tracking` | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Public origin | Used in invite e-mails |

## Backups (Postgres)

Pick **one** depending on host:

- **Neon** — automatic point-in-time recovery up to 7 days on the free tier.
  Nothing to configure. Verify in the Neon dashboard.
- **Railway / Fly / DigitalOcean Managed PG** — enable scheduled daily
  snapshots in the provider UI. Keep ≥ 7 days.
- **Self-hosted (VPS)** — `cron` running `pg_dump | gzip` to S3 once a day,
  retain 30 days. Example:

  ```cron
  30 3 * * * pg_dump "$DATABASE_URL" | gzip | aws s3 cp - s3://my-backups/customs/$(date +\%F).sql.gz
  ```

Restore drill: at least once before the first paying customer, restore a
backup to a scratch DB, point a staging build at it, and confirm login
works. **A backup you never restored is not a backup.**

## File storage

The MVP ships with a filesystem driver (`STORAGE_LOCAL_DIR`). For production:

1. Provision an S3-compatible bucket (Cloudflare R2 recommended — $0 egress).
2. Implement the S3 driver in `src/lib/storage/s3.ts` (interface is
   `StorageDriver` from `src/lib/storage/index.ts`).
3. Switch on `STORAGE_DRIVER=s3` (TODO: add env var read).
4. Object keys already use `org/<orgId>/process/<processId>/<docId>-<filename>`
   so migration of existing dev files is straightforward.

## Rate limiting

`src/lib/rate-limit.ts` is **in-memory** today: state lives in the Node
process and is lost on restart, and is not shared across instances. Good
enough to slow obvious abuse on a single deployment. For real protection:

- Front the app with **Vercel Edge Middleware** or **Cloudflare** rules.
- Replace `rateLimit()` with an **Upstash Redis** client. The function
  signature stays the same; callers don't change.

Current limits:

| Surface | Bucket key | Limit |
|---------|------------|-------|
| `/api/webhooks/tracking` | source IP | 60 / min |
| `/api/documents/[docId]/download` | session user id | 30 / min |
| upload action | session user id | 10 / min |

## Tracking webhook

See `docs/tracking-webhook.md` for the payload contract. To wire SeaRates or
Vizion in Phase 2:

1. Verify their UI accepts `POST /api/webhooks/tracking` with the documented
   shape (or translate via a small adapter).
2. Share `TRACKING_WEBHOOK_SECRET` as their HMAC secret.
3. Create `tracking_subscriptions` rows when the broker enters a container /
   BL / AWB on a process. (UI is a Phase 2 follow-up.)
4. Re-runs of the same event are idempotent via `provider_ref`.

## Security checklist before going live

- [ ] `AUTH_SECRET` is a fresh 32-byte random; not the dev value
- [ ] `TRACKING_WEBHOOK_SECRET` is a fresh 32-byte random
- [ ] `RESEND_API_KEY` set and the sending domain is verified
- [ ] `NEXT_PUBLIC_APP_URL` matches the actual public URL
- [ ] Postgres backups confirmed (see above)
- [ ] `pnpm audit` clean (run before each deploy)
- [ ] Run `pnpm tsx scripts/cross-org-probe.ts` against a copy of prod —
      all 11 probes pass
- [ ] At least two `broker_admin` users so the last-admin guard doesn't
      lock you out
- [ ] HTTPS terminated by the host (Vercel/Fly do this automatically)
- [ ] Cookies are `Secure` + `HttpOnly` + `SameSite=Lax` (Auth.js default)

## Diagnostic queries

```sql
-- Unread notifications per user
SELECT u.email, count(*) FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.read_at IS NULL
GROUP BY u.email ORDER BY 2 DESC;

-- Delayed processes (sanity-check the dashboard KPI)
SELECT reference, stage, arrival_date FROM processes
WHERE deleted_at IS NULL
  AND stage NOT IN ('released','delivered')
  AND arrival_date < CURRENT_DATE;

-- Pending invite tokens
SELECT identifier, expires FROM verification_tokens ORDER BY expires;

-- Documents grouped by status
SELECT status, count(*) FROM documents GROUP BY status;
```
