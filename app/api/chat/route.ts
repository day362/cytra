import { getModel } from "@/config/models";
import { MAX_HISTORY_MESSAGES } from "@/lib/chat/limits";
import { chatRequestSchema, type ChatErrorCode, type StreamEvent } from "@/lib/chat/protocol";
import { getServerEnv } from "@/lib/env";
import { runMockChat } from "@/lib/llm/mock";
import { upstreamModel } from "@/lib/llm/model-routing";
import { UpstreamError } from "@/lib/llm/openai-compatible";
import { runChat } from "@/lib/llm/run-chat";
import { systemPromptFor } from "@/lib/prompts/system";
import { clientKey, MemoryRateLimiter } from "@/lib/rate-limit";
import { encodeSSE } from "@/lib/sse";
import { getSupplierRepository } from "@/lib/suppliers/repository";

const MAX_BODY_BYTES = 256 * 1024;

const limiter = new MemoryRateLimiter(getServerEnv().RATE_LIMIT_CHAT_PER_MINUTE, 60_000);

function jsonError(status: number, code: ChatErrorCode, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
}

function describe(error: unknown): { code: ChatErrorCode; message: string } {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return { code: "timeout", message: "模型响应超时，请稍后重试。" };
  }
  if (error instanceof UpstreamError) {
    if (error.status === 429) return { code: "rate_limited", message: "模型服务繁忙，请稍后重试。" };
    if (error.status === 401 || error.status === 403) return { code: "upstream", message: "模型服务鉴权失败，请联系管理员检查配置。" };
    return { code: "upstream", message: "模型服务暂时不可用，请稍后重试。" };
  }
  // fetch() rejects with TypeError when the upstream host is unreachable.
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return { code: "upstream", message: "无法连接模型服务，请稍后重试。" };
  }
  return { code: "internal", message: "服务出现异常，请稍后重试。" };
}

export async function POST(request: Request) {
  const rate = limiter.take(clientKey(request));
  if (!rate.ok) {
    return jsonError(429, "rate_limited", "请求过于频繁，请稍后再试。", { "Retry-After": String(rate.retryAfterSeconds) });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return jsonError(413, "bad_request", "对话内容过长。");

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return jsonError(413, "bad_request", "对话内容过长。");
    body = JSON.parse(text);
  } catch {
    return jsonError(400, "bad_request", "请求格式不正确。");
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, "bad_request", "请求参数不正确。");

  const env = getServerEnv();
  const model = getModel(parsed.data.model)!;
  const history = parsed.data.messages.slice(-MAX_HISTORY_MESSAGES).filter((m) => m.content.trim().length > 0);
  const repo = getSupplierRepository();

  // Abort upstream work when the client disconnects or the deadline passes.
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS)]);

  const events: AsyncGenerator<StreamEvent> = env.demoMode
    ? runMockChat({ model, lastUserMessage: history.at(-1)!.content, repo, signal })
    : runChat({
        baseUrl: env.CYTRA_API_BASE_URL!,
        apiKey: env.CYTRA_API_KEY!,
        upstreamModel: upstreamModel(model.id),
        model,
        system: systemPromptFor(model, new Date().toISOString().slice(0, 10)),
        history,
        repo,
        signal,
      });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) => controller.enqueue(encodeSSE(event));
      send({ type: "meta", demo: env.demoMode, model: model.id });
      try {
        for await (const event of events) send(event);
      } catch (error) {
        if (request.signal.aborted) return controller.close();
        console.error("[api/chat]", error);
        send({ type: "error", ...describe(error) });
      }
      controller.close();
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
