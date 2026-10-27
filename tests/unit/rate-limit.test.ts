import { describe, expect, it } from "vitest";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";

describe("MemoryRateLimiter", () => {
  it("allows up to capacity, then refills over time", () => {
    let now = 0;
    const limiter = new MemoryRateLimiter(3, 60_000, () => now);
    expect([1, 2, 3].map(() => limiter.take("ip").ok)).toEqual([true, true, true]);
    const blocked = limiter.take("ip");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(20);
    now += 20_000;
    expect(limiter.take("ip").ok).toBe(true);
  });

  it("tracks keys independently and evicts the oldest beyond maxKeys", () => {
    const limiter = new MemoryRateLimiter(1, 60_000, () => 0, 2);
    limiter.take("a");
    limiter.take("b");
    limiter.take("c"); // evicts "a"
    expect(limiter.take("a").ok).toBe(true);
    expect(limiter.take("c").ok).toBe(false);
  });
});

describe("clientKey", () => {
  it("uses the first x-forwarded-for hop", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });
});
