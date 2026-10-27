/**
 * Token-bucket rate limiter.
 *
 * The in-memory store is per server instance: fine for a single Node process,
 * but on serverless or multi-instance deployments each instance counts
 * separately. Production should implement RateLimitStore over Redis/Upstash.
 */
export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export interface RateLimiter {
  take(key: string): RateLimitResult;
}

type Bucket = { tokens: number; updated: number };

export class MemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly refillPerMs: number;

  constructor(
    private readonly capacity: number,
    windowMs: number,
    private readonly now: () => number = Date.now,
    private readonly maxKeys = 10_000,
  ) {
    this.refillPerMs = capacity / windowMs;
  }

  take(key: string): RateLimitResult {
    const now = this.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updated: now };
    bucket.tokens = Math.min(this.capacity, bucket.tokens + (now - bucket.updated) * this.refillPerMs);
    bucket.updated = now;

    // Re-insert to keep Map order ≈ LRU, then evict the oldest if needed.
    this.buckets.delete(key);
    this.buckets.set(key, bucket);
    if (this.buckets.size > this.maxKeys) {
      const oldest = this.buckets.keys().next().value;
      if (oldest !== undefined) this.buckets.delete(oldest);
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
    }
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil((1 - bucket.tokens) / this.refillPerMs / 1000) };
  }
}

/** Best-effort client identifier behind a proxy / CDN. */
export function clientKey(request: Request): string {
  const h = request.headers;
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "anonymous";
}
