import { afterEach, describe, expect, it, vi } from "vitest";
import { getModel } from "@/config/models";
import { streamChatCompletion, UpstreamError } from "@/lib/llm/openai-compatible";
import { runChat } from "@/lib/llm/run-chat";
import { runMockChat } from "@/lib/llm/mock";
import { MockSupplierRepository } from "@/lib/suppliers/repository";
import { collect, sseResponse } from "./helpers";

const base = { baseUrl: "https://relay.test/v1", apiKey: "sk-test", model: "m", signal: new AbortController().signal };
const repo = new MockSupplierRepository();

const chunk = (delta: object, finish: string | null = null) => ({ choices: [{ delta, finish_reason: finish }] });

afterEach(() => vi.unstubAllGlobals());

describe("streamChatCompletion", () => {
  it("yields text deltas and assembles fragmented tool calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        chunk({ content: "先" }),
        chunk({ tool_calls: [{ index: 0, id: "call_1", function: { name: "search_", arguments: '{"mat' } }] }),
        chunk({ tool_calls: [{ index: 0, function: { name: "suppliers", arguments: 'erial":"酶"}' } }] }),
        chunk({}, "tool_calls"),
        "[DONE]",
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const out = await collect(streamChatCompletion({ ...base, messages: [{ role: "user", content: "hi" }] }));
    expect(out).toEqual([
      { type: "text", delta: "先" },
      { type: "tool_calls", calls: [{ id: "call_1", type: "function", function: { name: "search_suppliers", arguments: '{"material":"酶"}' } }] },
      { type: "finish", reason: "tool_calls" },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://relay.test/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer sk-test");
    expect(JSON.parse(init.body)).toMatchObject({ model: "m", stream: true });
  });

  it("throws UpstreamError with status on HTTP failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 429 })));
    await expect(collect(streamChatCompletion({ ...base, messages: [] }))).rejects.toMatchObject({ name: "UpstreamError", status: 429 });
    expect(new UpstreamError("x", 1)).toBeInstanceOf(Error);
  });
});

describe("runChat", () => {
  it("executes the supplier tool, then streams the follow-up answer", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        sseResponse([
          chunk({ tool_calls: [{ index: 0, id: "c1", function: { name: "search_suppliers", arguments: '{"material":"CHO 培养基","grade":"GMP"}' } }] }),
          chunk({}, "tool_calls"),
        ]),
      )
      .mockResolvedValueOnce(sseResponse([chunk({ content: "对比如下" }), chunk({}, "stop")]));
    vi.stubGlobal("fetch", fetchMock);

    const events = await collect(
      runChat({ ...base, upstreamModel: "m", model: getModel("cytra-bio")!, system: "sys", history: [{ role: "user", content: "找厂家" }], repo }),
    );

    expect(events.map((e) => e.type)).toEqual(["suppliers", "text", "done"]);
    const second = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(second.messages.at(-1)).toMatchObject({ role: "tool", tool_call_id: "c1" });
    expect(JSON.parse(second.messages.at(-1).content).demo_data).toBe(true);
  });

  it("never sends tools for relay models", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([chunk({ content: "hi" }), chunk({}, "stop")]));
    vi.stubGlobal("fetch", fetchMock);
    await collect(runChat({ ...base, upstreamModel: "m", model: getModel("gpt")!, system: "s", history: [{ role: "user", content: "x" }], repo }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).tools).toBeUndefined();
  });

  it("reports invalid tool arguments back to the model instead of crashing", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sseResponse([chunk({ tool_calls: [{ index: 0, id: "c1", function: { name: "search_suppliers", arguments: "{bad" } }] })]))
      .mockResolvedValueOnce(sseResponse([chunk({ content: "抱歉" })]));
    vi.stubGlobal("fetch", fetchMock);
    const events = await collect(
      runChat({ ...base, upstreamModel: "m", model: getModel("cytra-bio")!, system: "s", history: [{ role: "user", content: "x" }], repo }),
    );
    expect(events.some((e) => e.type === "suppliers")).toBe(false);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).messages.at(-1).content).toContain("error");
  });
});

describe("runMockChat", () => {
  it("emits supplier cards for supplier intent on the dedicated model", async () => {
    const events = await collect(
      runMockChat({ model: getModel("cytra-bio")!, lastUserMessage: "找 GMP 级胰蛋白酶厂家", repo, signal: new AbortController().signal, pace: 0 }),
    );
    const suppliers = events.find((e) => e.type === "suppliers");
    expect(suppliers && suppliers.type === "suppliers" && suppliers.result.suppliers.length).toBeGreaterThan(0);
    expect(events.at(-1)).toEqual({ type: "done", reason: "stop" });
  });

  it("refuses to list suppliers on relay models", async () => {
    const events = await collect(runMockChat({ model: getModel("gpt")!, lastUserMessage: "推荐厂家", repo, signal: new AbortController().signal, pace: 0 }));
    expect(events.some((e) => e.type === "suppliers")).toBe(false);
  });

  it("stops promptly when aborted", async () => {
    const controller = new AbortController();
    const gen = runMockChat({ model: getModel("cytra-bio")!, lastUserMessage: "你好", repo, signal: controller.signal });
    controller.abort();
    await expect(gen.next()).rejects.toBeDefined();
  });
});
