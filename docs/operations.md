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

## Backups

### Postgres (VPS — running pg locally)

```cron
# As user customs (sudo crontab -u customs -e):
30 3 * * * pg_dump -Fc "$DATABASE_URL" > /home/customs/backups/$(date +\%F).dump 2>> /home/customs/backups/cron.log
0  4 * * * find /home/customs/backups -name "*.dump" -mtime +30 -delete
```

Off-machine copy (cheap insurance — rclone to any S3-compatible bucket):

```cron
15 4 * * * rclone copy /home/customs/backups r2:customs-backups
```

If you prefer managed Postgres (Neon / Railway / RDS / DO), enable their
built-in daily snapshots and keep ≥ 7 days.

### File storage

The default driver writes uploaded documents to `STORAGE_LOCAL_DIR`
(`/home/customs/storage` in the VPS layout). Sync it the same way:

```cron
0 5 * * * rclone sync /home/customs/storage r2:customs-storage
```

### Restore drill

Before the first paying customer, restore a backup to a scratch DB, point
a staging build at it, and confirm login + an upload + a download work.
**A backup you never restored is not a backup.**

```bash
# Scratch DB
sudo -u postgres createdb customs_restore_test
pg_restore -d "postgresql://customs:<pw>@localhost/customs_restore_test" \
  /home/customs/backups/2026-05-13.dump

# Try a query
PGPASSWORD=<pw> psql -h localhost -U customs -d customs_restore_test \
  -c "SELECT count(*) FROM processes;"

sudo -u postgres dropdb customs_restore_test
```

## File storage drivers

Two drivers ship behind a single `StorageDriver` interface
(`src/lib/storage/index.ts`):

| `STORAGE_DRIVER` | Best for | Notes |
|------------------|----------|-------|
| `local` (default) | Single VPS, Fly volume, Railway disk | Uses `STORAGE_LOCAL_DIR`. Survives systemd restarts; **not** Vercel (ephemeral FS). |
| `s3` | Multiple app instances, Vercel, large scale | Cloudflare R2 / AWS S3 / MinIO. Requires `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` and `S3_ENDPOINT`+`S3_REGION` for R2/MinIO. |

Switching driver doesn't touch the DB — only changes where bytes live. To
migrate existing files when switching, copy `STORAGE_LOCAL_DIR` to the
bucket preserving the `org/.../process/.../{docId}-{filename}` keys
(`rclone copy /home/customs/storage r2:customs-documents`).

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
