import { afterEach, describe, expect, it, vi } from "vitest";
import { getModel } from "@/config/models";
import { flattenHistory, runOpencodeChat } from "@/lib/llm/opencode";
import { MockSupplierRepository } from "@/lib/suppliers/repository";
import { supplierQueryFrom } from "@/lib/suppliers/intent";
import { collect, sseResponse } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

const S = "ses_1";
const ev = (type: string, properties: object) => ({ type, properties });
const msg = (id: string, role: string) => ev("message.updated", { sessionID: S, info: { id, role, sessionID: S } });
const part = (id: string, messageID: string, type: string, text = "") =>
  ev("message.part.updated", { sessionID: S, part: { id, messageID, sessionID: S, type, text }, time: 1 });
const delta = (partID: string, messageID: string, d: string) =>
  ev("message.part.delta", { sessionID: S, messageID, partID, field: "text", delta: d });

/** Routes the adapter's HTTP calls to canned OpenCode responses and records them. */
function fakeOpencode(events: object[]) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname;
    const method = init.method ?? "GET";
    calls.push({ url: path, method, body: init.body ? JSON.parse(String(init.body)) : undefined });
    if (path === "/session" && method === "POST") return Response.json({ id: S });
    if (path === "/event") return sseResponse(events);
    if (path.endsWith("/prompt_async")) return new Response(null, { status: 204 });
    return Response.json(true);
  });
  vi.stubGlobal("fetch", fetchMock);
  return calls;
}

const base = {
  baseUrl: "http://127.0.0.1:4096",
  model: "opencode/deepseek-v4.1-flash-free",
  system: "SYS",
  repo: new MockSupplierRepository(),
  signal: new AbortController().signal,
};

describe("runOpencodeChat", () => {
  it("streams only assistant text, dropping user, reasoning and other sessions' parts", async () => {
    const calls = fakeOpencode([
      msg("msg_u", "user"),
      part("prt_u", "msg_u", "text", "用户的问题"),
      msg("msg_a", "assistant"),
      part("prt_r", "msg_a", "reasoning"),
      delta("prt_r", "msg_a", "（思考过程）"),
      delta("prt_t", "msg_a", "先到的"), // arrives before its part type is known
      part("prt_t", "msg_a", "text", "先到的"),
      delta("prt_t", "msg_a", "回答。"),
      { type: "message.part.delta", properties: { sessionID: "ses_other", messageID: "x", partID: "y", field: "text", delta: "别人的" } },
      ev("session.idle", { sessionID: S }),
    ]);

    const out = await collect(runOpencodeChat({ ...base, modelOption: getModel("gpt")!, history: [{ role: "user", content: "你好" }] }));
    expect(out.filter((e) => e.type === "text").map((e) => (e as { delta: string }).delta).join("")).toBe("先到的回答。");
    expect(out.at(-1)).toEqual({ type: "done", reason: "stop" });

    const create = calls.find((c) => c.url === "/session" && c.method === "POST")!;
    expect(create.body).toMatchObject({ permission: [{ permission: "*", pattern: "*", action: "deny" }] });
    const prompt = calls.find((c) => c.url.endsWith("/prompt_async"))!.body as { agent: string; model: unknown; tools: Record<string, boolean> };
    expect(prompt.agent).toBe("cytra");
    expect(prompt.model).toEqual({ providerID: "opencode", modelID: "deepseek-v4.1-flash-free" });
    expect(prompt.tools.bash).toBe(false);
    expect(prompt.tools.edit).toBe(false);
    // Session is always cleaned up.
    expect(calls.some((c) => c.url === `/session/${S}` && c.method === "DELETE")).toBe(true);
  });

  it("emits text from full-part updates when no deltas are sent", async () => {
    fakeOpencode([msg("msg_a", "assistant"), part("prt_t", "msg_a", "text", "完整"), part("prt_t", "msg_a", "text", "完整回答"), ev("session.idle", { sessionID: S })]);
    const out = await collect(runOpencodeChat({ ...base, modelOption: getModel("gpt")!, history: [{ role: "user", content: "x" }] }));
    expect(out.filter((e) => e.type === "text").map((e) => (e as { delta: string }).delta)).toEqual(["完整", "回答"]);
  });

  it("looks up suppliers itself and passes results to the model", async () => {
    const calls = fakeOpencode([msg("msg_a", "assistant"), part("prt_t", "msg_a", "text", "好的"), ev("session.idle", { sessionID: S })]);
    const out = await collect(
      runOpencodeChat({ ...base, modelOption: getModel("cytra-bio")!, history: [{ role: "user", content: "找 GMP 级胰蛋白酶厂家" }] }),
    );
    expect(out[0].type).toBe("suppliers");
    const prompt = calls.find((c) => c.url.endsWith("/prompt_async"))!.body as { system: string };
    expect(prompt.system).toContain("本轮厂家库检索结果");
    expect(prompt.system).toContain("示例·恒溯酶工程");
  });

  it("raises session errors with the provider message", async () => {
    fakeOpencode([ev("session.error", { sessionID: S, error: { name: "APIError", data: { message: "model not found" } } })]);
    await expect(collect(runOpencodeChat({ ...base, modelOption: getModel("gpt")!, history: [{ role: "user", content: "x" }] }))).rejects.toThrow("model not found");
  });

  it("explains how to start OpenCode when it is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(collect(runOpencodeChat({ ...base, modelOption: getModel("gpt")!, history: [{ role: "user", content: "x" }] }))).rejects.toThrow(
      "npm run opencode",
    );
  });
});

describe("flattenHistory", () => {
  it("passes a single message through and labels earlier turns", () => {
    expect(flattenHistory([{ role: "user", content: "只有一句" }])).toBe("只有一句");
    const text = flattenHistory([
      { role: "user", content: "A" },
      { role: "assistant", content: "B" },
      { role: "user", content: "C" },
    ]);
    expect(text).toContain("【用户】\nA");
    expect(text).toContain("【助手】\nB");
    expect(text.endsWith("用户当前的问题：\nC")).toBe(true);
  });
});

describe("supplierQueryFrom", () => {
  it("detects supplier intent, material, grade and AOF", () => {
    expect(supplierQueryFrom("Protein A 货期多久")).toBeNull();
    expect(supplierQueryFrom("找无动物源 GMP CHO 培养基厂家")).toEqual({ material: "CHO 培养基", grade: "GMP", animal_origin_free: true });
  });
});
