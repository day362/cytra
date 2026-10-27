import type { ModelOption } from "@/config/models";
import type { StreamEvent, WireMessage } from "@/lib/chat/protocol";
import { readSSE } from "@/lib/sse";
import { supplierQueryFrom } from "@/lib/suppliers/intent";
import type { SupplierRepository } from "@/lib/suppliers/repository";
import { runSupplierTool } from "./tools";

/**
 * Adapter for a local `opencode serve` instance (OpenCode's headless HTTP API).
 *
 * Lets the site use whatever models the developer's own OpenCode can reach —
 * including its free tier — without an API key. Local only: the website
 * server must be able to reach OpenCode on 127.0.0.1.
 *
 * Safety: OpenCode is a coding agent that can run shell commands and edit
 * files. Every session is created with a deny-all permission ruleset and every
 * prompt disables all tools, on top of the restricted `cytra` agent written by
 * `npm run opencode`. Website input can only ever produce text.
 */

export const OPENCODE_AGENT = "cytra";

/** Every built-in tool name we know of, switched off per request. */
const DISABLED_TOOLS = Object.fromEntries(
  [
    "bash", "edit", "write", "read", "glob", "grep", "list", "patch", "multiedit", "todowrite", "todoread",
    "webfetch", "websearch", "codesearch", "task", "skill", "question", "lsp",
  ].map((name) => [name, false]),
);

const DENY_ALL = [{ permission: "*", pattern: "*", action: "deny" }];

export class OpencodeError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "OpencodeError";
  }
}

type Options = {
  baseUrl: string;
  /** provider/model, e.g. "opencode/deepseek-v4.1-flash-free". */
  model: string;
  password?: string;
  modelOption: ModelOption;
  system: string;
  history: WireMessage[];
  repo: SupplierRepository;
  signal: AbortSignal;
};

type OcEvent = { type: string; properties: Record<string, unknown> };
type OcPart = { id: string; messageID: string; sessionID: string; type: string; text?: string };

/** OpenCode sessions are created fresh per request, so prior turns travel as text. */
export function flattenHistory(history: WireMessage[]): string {
  const last = history.at(-1)!;
  if (history.length === 1) return last.content;
  const earlier = history
    .slice(0, -1)
    .map((m) => `【${m.role === "user" ? "用户" : "助手"}】\n${m.content}`)
    .join("\n\n");
  return `以下是你与用户此前的对话，仅供理解上下文：\n\n${earlier}\n\n——\n用户当前的问题：\n${last.content}`;
}

function splitModel(model: string) {
  const slash = model.indexOf("/");
  return { providerID: model.slice(0, slash), modelID: model.slice(slash + 1) };
}

function errorText(error: unknown): string {
  const e = error as { name?: string; data?: { message?: string } } | undefined;
  return e?.data?.message || e?.name || "OpenCode 返回了未知错误";
}

export async function* runOpencodeChat(opts: Options): AsyncGenerator<StreamEvent> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.password) headers.Authorization = `Basic ${Buffer.from(`opencode:${opts.password}`).toString("base64")}`;

  const call = async (path: string, init: RequestInit = {}) => {
    let res: Response;
    try {
      res = await fetch(`${opts.baseUrl}${path}`, { ...init, headers: { ...headers, ...init.headers } });
    } catch (error) {
      if (init.signal?.aborted) throw error;
      throw new OpencodeError("连不上本机 OpenCode，请先在另一个终端运行 npm run opencode", 503);
    }
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new OpencodeError(`OpenCode ${path} 返回 ${res.status}: ${detail}`, res.status);
    }
    return res;
  };

  // 1. Supplier lookup happens here, since the model cannot call our tool through OpenCode.
  let system = opts.system;
  const lastUser = opts.history.at(-1)!.content;
  const query = opts.modelOption.supplierTools ? supplierQueryFrom(lastUser) : null;
  if (query) {
    const outcome = await runSupplierTool(JSON.stringify(query), opts.repo);
    if (outcome.ok) {
      yield { type: "suppliers", result: outcome.result };
      system += `\n\n## 本轮厂家库检索结果\n系统已经替你检索了厂家库，结果已作为卡片展示给用户。你只能引用下面列出的厂家，不得补充其他厂家；demo_data 为 true 时要提醒用户这是示例数据。\n${outcome.forModel}`;
    }
  }
  system += "\n\n## 运行环境\n本次对话中你无法调用任何工具，也不要提及工具、文件或代码仓库，直接输出给用户的回答正文。";

  // 2. Fresh, locked-down session.
  const session = (await (
    await call("/session", { method: "POST", body: JSON.stringify({ title: "Cytra 网站对话", permission: DENY_ALL }), signal: opts.signal })
  ).json()) as { id: string };

  const events = new AbortController();
  const onAbort = () => events.abort();
  opts.signal.addEventListener("abort", onAbort, { once: true });

  try {
    // 3. Subscribe before prompting so no event is missed.
    const stream = await call("/event", { headers: { Accept: "text/event-stream" }, signal: events.signal });
    await call(`/session/${session.id}/prompt_async`, {
      method: "POST",
      body: JSON.stringify({
        agent: OPENCODE_AGENT,
        model: splitModel(opts.model),
        system,
        tools: DISABLED_TOOLS,
        parts: [{ type: "text", text: flattenHistory(opts.history) }],
      }),
      signal: opts.signal,
    });

    // 4. Translate OpenCode events into ours. Only text parts of assistant
    //    messages are forwarded; reasoning, tool and user parts are dropped.
    const roles = new Map<string, string>();
    const partTypes = new Map<string, string>();
    const partMessage = new Map<string, string>();
    const emitted = new Map<string, string>();
    const pendingDeltas = new Map<string, string>();
    let streamedAny = false;

    const forward = function* (partId: string, text: string): Generator<StreamEvent> {
      if (!text) return;
      emitted.set(partId, (emitted.get(partId) ?? "") + text);
      streamedAny = true;
      yield { type: "text", delta: text };
    };
    const isAssistantText = (partId: string) =>
      partTypes.get(partId) === "text" && roles.get(partMessage.get(partId) ?? "") === "assistant";

    for await (const data of readSSE(stream.body!, events.signal)) {
      let event: OcEvent;
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      const p = event.properties ?? {};
      const part = p.part as OcPart | undefined;
      const sessionID = (p.sessionID as string | undefined) ?? part?.sessionID ?? (p.info as { sessionID?: string } | undefined)?.sessionID;
      if (sessionID !== session.id) continue;

      if (event.type === "message.updated") {
        const info = p.info as { id: string; role: string };
        roles.set(info.id, info.role);
      } else if (event.type === "message.part.updated" && part) {
        partTypes.set(part.id, part.type);
        partMessage.set(part.id, part.messageID);
        if (!isAssistantText(part.id)) continue;
        const buffered = pendingDeltas.get(part.id);
        if (buffered) {
          pendingDeltas.delete(part.id);
          yield* forward(part.id, buffered);
        }
        // Updates carry the full text so far: emit whatever deltas did not cover.
        const sent = emitted.get(part.id) ?? "";
        if (part.text && part.text.length > sent.length && part.text.startsWith(sent)) {
          yield* forward(part.id, part.text.slice(sent.length));
        }
      } else if (event.type === "message.part.delta") {
        const partId = p.partID as string;
        if (p.field !== "text") continue;
        if (!partTypes.has(partId)) {
          // Type not known yet: hold the text until its part.updated arrives.
          pendingDeltas.set(partId, (pendingDeltas.get(partId) ?? "") + (p.delta as string));
          partMessage.set(partId, p.messageID as string);
        } else if (isAssistantText(partId)) {
          yield* forward(partId, p.delta as string);
        }
      } else if (event.type === "session.error") {
        const error = p.error as { name?: string } | undefined;
        if (error?.name === "MessageAbortedError") break;
        throw new OpencodeError(errorText(error));
      } else if (event.type === "session.idle" || (event.type === "session.status" && (p.status as { type?: string })?.type === "idle" && streamedAny)) {
        break;
      }
    }

    // 5. Safety net: if the event stream yielded no text, read the final message.
    if (!streamedAny && !opts.signal.aborted) {
      const messages = (await (await call(`/session/${session.id}/message`, { signal: opts.signal })).json()) as Array<{
        info: { role: string };
        parts: OcPart[];
      }>;
      const text = messages
        .filter((m) => m.info.role === "assistant")
        .flatMap((m) => m.parts.filter((x) => x.type === "text").map((x) => x.text ?? ""))
        .join("");
      if (text) yield { type: "text", delta: text };
      else throw new OpencodeError("OpenCode 没有返回内容，请确认模型可用（终端运行 opencode models）");
    }

    if (!opts.signal.aborted) yield { type: "done", reason: "stop" };
  } finally {
    opts.signal.removeEventListener("abort", onAbort);
    events.abort();
    if (opts.signal.aborted) {
      await call(`/session/${session.id}/abort`, { method: "POST" }).catch(() => {});
    }
    // Keep the developer's OpenCode session list clean.
    await call(`/session/${session.id}`, { method: "DELETE" }).catch(() => {});
  }
}
