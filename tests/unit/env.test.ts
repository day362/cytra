import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadEnv() {
  return (await import("@/lib/env")).getServerEnv();
}

describe("getServerEnv", () => {
  it("is in demo mode without credentials and applies defaults", async () => {
    vi.stubEnv("CYTRA_API_BASE_URL", "");
    vi.stubEnv("CYTRA_API_KEY", "");
    const env = await loadEnv();
    expect(env.demoMode).toBe(true);
    expect(env.RATE_LIMIT_CHAT_PER_MINUTE).toBe(20);
  });

  it("leaves demo mode when both URL and key are set, trimming trailing slashes", async () => {
    vi.stubEnv("CYTRA_API_BASE_URL", "https://relay.test/v1/");
    vi.stubEnv("CYTRA_API_KEY", "sk-x");
    const env = await loadEnv();
    expect(env.demoMode).toBe(false);
    expect(env.CYTRA_API_BASE_URL).toBe("https://relay.test/v1");
  });

  it("fails loudly on malformed values", async () => {
    vi.stubEnv("CYTRA_API_BASE_URL", "not a url");
    await expect(loadEnv()).rejects.toThrow(/Invalid server environment/);
  });
});
