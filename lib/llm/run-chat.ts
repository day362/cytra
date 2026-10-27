import type { ModelOption } from "@/config/models";
import type { StreamEvent, WireMessage } from "@/lib/chat/protocol";
import type { SupplierRepository } from "@/lib/suppliers/repository";
import { streamChatCompletion, type UpstreamMessage } from "./openai-compatible";
import { runSupplierTool, SEARCH_SUPPLIERS, supplierTool } from "./tools";

const MAX_STEPS = 3;

type RunOptions = {
  baseUrl: string;
  apiKey: string;
  upstreamModel: string;
  model: ModelOption;
  system: string;
  history: WireMessage[];
  repo: SupplierRepository;
  signal: AbortSignal;
};

/**
 * Drives the model → tool → model loop and translates it into StreamEvents.
 * Only the dedicated model gets tools; relay models are plain pass-through.
 */
export async function* runChat(opts: RunOptions): AsyncGenerator<StreamEvent> {
  const messages: UpstreamMessage[] = [{ role: "system", content: opts.system }, ...opts.history];
  const tools = opts.model.supplierTools ? [supplierTool] : undefined;

  for (let step = 0; step < MAX_STEPS; step++) {
    let text = "";
    let calls: Extract<UpstreamMessage, { role: "assistant" }>["tool_calls"];
    let finish = "stop";

    for await (const chunk of streamChatCompletion({
      baseUrl: opts.baseUrl,
      apiKey: opts.apiKey,
      model: opts.upstreamModel,
      messages,
      // On the last step, withhold tools so the model must answer in prose.
      tools: step < MAX_STEPS - 1 ? tools : undefined,
      signal: opts.signal,
    })) {
      if (chunk.type === "text") {
        text += chunk.delta;
        yield { type: "text", delta: chunk.delta };
      } else if (chunk.type === "tool_calls") {
        calls = chunk.calls;
      } else {
        finish = chunk.reason;
      }
    }

    if (!calls?.length) {
      yield { type: "done", reason: finish === "length" ? "length" : "stop" };
      return;
    }

    messages.push({ role: "assistant", content: text || null, tool_calls: calls });
    for (const call of calls) {
      if (call.function.name !== SEARCH_SUPPLIERS) {
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "未知工具" }) });
        continue;
      }
      const outcome = await runSupplierTool(call.function.arguments, opts.repo);
      if (outcome.ok) yield { type: "suppliers", result: outcome.result };
      messages.push({ role: "tool", tool_call_id: call.id, content: outcome.forModel });
    }
    // Separate the pre-tool sentence from the follow-up answer.
    if (text) yield { type: "text", delta: "\n\n" };
  }

  yield { type: "done", reason: "tool_limit" };
}
