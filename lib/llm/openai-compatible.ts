import { readSSE } from "@/lib/sse";

/** Subset of the OpenAI Chat Completions message format we send upstream. */
export type UpstreamMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

export type ToolDefinition = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type UpstreamChunk =
  | { type: "text"; delta: string }
  | { type: "tool_calls"; calls: ToolCall[] }
  | { type: "finish"; reason: string };

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

type StreamOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: UpstreamMessage[];
  tools?: ToolDefinition[];
  signal: AbortSignal;
  temperature?: number;
};

type DeltaToolCall = { index: number; id?: string; function?: { name?: string; arguments?: string } };
type CompletionChunk = {
  choices?: Array<{
    delta?: { content?: string | null; tool_calls?: DeltaToolCall[] };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
};

/**
 * Streams one Chat Completions request. Text deltas are yielded as they
 * arrive; tool calls arrive in fragments and are yielded once, assembled,
 * when the model finishes the turn.
 */
export async function* streamChatCompletion(opts: StreamOptions): AsyncGenerator<UpstreamChunk> {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: true,
      temperature: opts.temperature ?? 0.4,
      ...(opts.tools?.length ? { tools: opts.tools, tool_choice: "auto" } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    // Read a bounded slice of the error for server logs only; never forwarded to clients.
    const detail = (await res.text().catch(() => "")).slice(0, 500);
    throw new UpstreamError(`Upstream ${res.status}: ${detail}`, res.status);
  }

  const pending = new Map<number, { id: string; name: string; args: string }>();
  let finish = "stop";

  for await (const data of readSSE(res.body, opts.signal)) {
    if (data === "[DONE]") break;
    let chunk: CompletionChunk;
    try {
      chunk = JSON.parse(data);
    } catch {
      continue; // Keep-alive or vendor noise.
    }
    if (chunk.error) throw new UpstreamError(chunk.error.message ?? "Upstream stream error", 502);

    const choice = chunk.choices?.[0];
    if (!choice) continue;

    const text = choice.delta?.content;
    if (text) yield { type: "text", delta: text };

    for (const part of choice.delta?.tool_calls ?? []) {
      const slot = pending.get(part.index) ?? { id: "", name: "", args: "" };
      if (part.id) slot.id = part.id;
      if (part.function?.name) slot.name += part.function.name;
      if (part.function?.arguments) slot.args += part.function.arguments;
      pending.set(part.index, slot);
    }
    if (choice.finish_reason) finish = choice.finish_reason;
  }

  if (pending.size) {
    yield {
      type: "tool_calls",
      calls: [...pending.entries()]
        .sort(([a], [b]) => a - b)
        .map(([index, c]) => ({
          id: c.id || `call_${index}`,
          type: "function" as const,
          function: { name: c.name, arguments: c.args || "{}" },
        })),
    };
  }
  yield { type: "finish", reason: finish };
}
