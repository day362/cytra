import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load(env: Record<string, string>) {
  for (const [k, v] of Object.entries({ CYTRA_API_BASE_URL: "", CYTRA_API_KEY: "", CYTRA_ENABLED_MODELS: "", CYTRA_MODEL_MAP: "", ...env })) {
    vi.stubEnv(k, v);
  }
  return import("@/lib/llm/model-routing");
}

const live = { CYTRA_API_BASE_URL: "https://api.deepseek.com/v1", CYTRA_API_KEY: "sk-x" };

describe("enabledModels", () => {
  it("serves every model in demo mode, even if a list is set", async () => {
    const m = await load({ CYTRA_ENABLED_MODELS: "deepseek" });
    expect(m.enabledModels()).toHaveLength(6);
  });

  it("restricts to the configured ids in catalogue order", async () => {
    const m = await load({ ...live, CYTRA_ENABLED_MODELS: "deepseek, cytra-bio" });
    expect(m.enabledModels()).toEqual(["cytra-bio", "deepseek"]);
    expect(m.defaultModel()).toBe("cytra-bio");
  });

  it("falls back to the first enabled model when Cytra Bio is off", async () => {
    const m = await load({ ...live, CYTRA_ENABLED_MODELS: "qwen,deepseek" });
    expect(m.defaultModel()).toBe("deepseek");
  });

  it("rejects unknown ids", async () => {
    const m = await load({ ...live, CYTRA_ENABLED_MODELS: "gpt-9" });
    expect(() => m.enabledModels()).toThrow(/unknown ids: gpt-9/);
  });

  it("maps several public ids to one upstream model", async () => {
    const m = await load({ ...live, CYTRA_MODEL_MAP: '{"cytra-bio":"deepseek-v4.1-flash","deepseek":"deepseek-v4.1-flash"}' });
    expect(m.upstreamModel("cytra-bio")).toBe("deepseek-v4.1-flash");
    expect(m.upstreamModel("gpt")).toBe("gpt-4.1");
  });
});
