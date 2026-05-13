type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

export type RateLimitOptions = {
  bucket: string;
  max: number;
  windowMs: number;
};

/**
 * In-memory fixed-window limiter.
 *
 * Returns `true` when the request is allowed. Best-effort only: state is per
 * Node process and is lost on restart, and is not shared across instances in
 * a horizontally scaled deploy. In prod replace with Upstash, Redis, or a
 * Postgres-backed equivalent. The signature stays the same so callers don't
 * change.
 */
export function rateLimit({ bucket, max, windowMs }: RateLimitOptions): boolean {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(bucket);
  if (!existing || existing.resetAt < now) {
    buckets.set(bucket, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= max) return false;
  existing.count += 1;
  return true;
}
