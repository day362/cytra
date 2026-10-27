"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelId } from "@/config/models";
import { readSSE } from "@/lib/sse";
import { historyStore } from "./history-store";
import { MAX_TITLE_CHARS } from "./limits";
import type { StreamEvent, WireMessage } from "./protocol";
import { messageText, newId, type ChatMessage, type Conversation, type MessagePart } from "./types";

function toWire(messages: ChatMessage[]): WireMessage[] {
  return messages
    .filter((m) => m.role === "user" || (m.status !== "error" && messageText(m).trim()))
    .map((m) => ({ role: m.role, content: messageText(m) }));
}

function appendText(parts: MessagePart[], text: string): MessagePart[] {
  const last = parts.at(-1);
  if (last?.type === "text") return [...parts.slice(0, -1), { type: "text", text: last.text + text }];
  return [...parts, { type: "text", text }];
}

function patchMessage(conversationId: string, messageId: string, fn: (m: ChatMessage) => ChatMessage, immediate = false) {
  historyStore.update(
    conversationId,
    (c) => ({ ...c, updatedAt: Date.now(), messages: c.messages.map((m) => (m.id === messageId ? fn(m) : m)) }),
    immediate,
  );
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error?.message === "string") return body.error.message;
  } catch {
    /* fall through */
  }
  return res.status === 429 ? "请求过于频繁，请稍后再试。" : "服务暂时不可用，请稍后重试。";
}

export function useChatRunner() {
  const controllers = useRef(new Map<string, AbortController>());
  const [streaming, setStreaming] = useState<ReadonlySet<string>>(new Set());
  const [demo, setDemo] = useState<boolean | null>(null);

  useEffect(() => {
    const map = controllers.current;
    return () => map.forEach((c) => c.abort());
  }, []);

  const setBusy = (id: string, busy: boolean) =>
    setStreaming((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const run = useCallback(async (conversationId: string, history: ChatMessage[], model: ModelId) => {
    const assistant: ChatMessage = {
      id: newId("m_"),
      role: "assistant",
      parts: [],
      createdAt: Date.now(),
      model,
      status: "streaming",
    };
    historyStore.update(conversationId, (c) => ({ ...c, model, updatedAt: Date.now(), messages: [...history, assistant] }), true);

    const controller = new AbortController();
    controllers.current.get(conversationId)?.abort();
    controllers.current.set(conversationId, controller);
    setBusy(conversationId, true);

    // Batch text deltas into one store update per animation frame.
    let buffer = "";
    let frame = 0;
    const flushText = () => {
      frame = 0;
      if (!buffer) return;
      const text = buffer;
      buffer = "";
      patchMessage(conversationId, assistant.id, (m) => ({ ...m, parts: appendText(m.parts, text) }));
    };
    const finish = (patch: Partial<ChatMessage>) => {
      cancelAnimationFrame(frame);
      flushText();
      patchMessage(conversationId, assistant.id, (m) => ({ ...m, ...patch }), true);
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: toWire(history) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        finish({ status: "error", error: await errorMessage(res) });
        return;
      }

      let ended = false;
      for await (const data of readSSE(res.body, controller.signal)) {
        let event: StreamEvent;
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }
        if (event.type === "meta") setDemo(event.demo);
        else if (event.type === "text") {
          buffer += event.delta;
          frame ||= requestAnimationFrame(flushText);
        } else if (event.type === "suppliers") {
          cancelAnimationFrame(frame);
          flushText();
          patchMessage(conversationId, assistant.id, (m) => ({ ...m, parts: [...m.parts, { type: "suppliers", result: event.result }] }));
        } else if (event.type === "error") {
          ended = true;
          finish({ status: "error", error: event.message });
        } else if (event.type === "done") {
          ended = true;
          finish({ status: "done" });
        }
      }
      if (!ended) finish({ status: controller.signal.aborted ? "aborted" : "error", error: controller.signal.aborted ? undefined : "连接意外中断，请重试。" });
    } catch (error) {
      if (controller.signal.aborted) finish({ status: "aborted" });
      else {
        console.warn("[chat]", error);
        finish({ status: "error", error: "网络连接异常，请检查网络后重试。" });
      }
    } finally {
      if (controllers.current.get(conversationId) === controller) controllers.current.delete(conversationId);
      setBusy(conversationId, false);
    }
  }, []);

  /** Creates the conversation if needed. Returns its id. */
  const send = useCallback(
    (conversationId: string | null, text: string, model: ModelId): string => {
      const content = text.trim();
      const id = conversationId ?? newId("c_");
      const user: ChatMessage = { id: newId("m_"), role: "user", parts: [{ type: "text", text: content }], createdAt: Date.now() };
      const existing = historyStore.get(id);
      if (!existing) {
        const now = Date.now();
        const title = content.replace(/\s+/g, " ").slice(0, MAX_TITLE_CHARS);
        const conversation: Conversation = { id, title, model, createdAt: now, updatedAt: now, messages: [] };
        historyStore.upsert(conversation, true);
      }
      const history = [...(existing?.messages ?? []), user];
      void run(id, history, model);
      return id;
    },
    [run],
  );

  const stop = useCallback((conversationId: string) => {
    controllers.current.get(conversationId)?.abort();
  }, []);

  /** Re-runs the last assistant turn, optionally with a different model. */
  const retry = useCallback(
    (conversationId: string, model?: ModelId) => {
      const conversation = historyStore.get(conversationId);
      if (!conversation) return;
      const lastUser = conversation.messages.findLastIndex((m) => m.role === "user");
      if (lastUser < 0) return;
      void run(conversationId, conversation.messages.slice(0, lastUser + 1), model ?? conversation.model);
    },
    [run],
  );

  return { send, stop, retry, streaming, demo };
}
