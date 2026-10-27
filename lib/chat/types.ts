import type { ModelId } from "@/config/models";
import type { SupplierResult } from "@/lib/suppliers/types";

export type MessagePart = { type: "text"; text: string } | { type: "suppliers"; result: SupplierResult };

export type MessageStatus = "streaming" | "done" | "aborted" | "error";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  createdAt: number;
  /** Assistant only. */
  model?: ModelId;
  status?: MessageStatus;
  error?: string;
};

export type Conversation = {
  id: string;
  title: string;
  model: ModelId;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export function messageText(message: ChatMessage): string {
  return message.parts
    .filter((p): p is Extract<MessagePart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function newId(prefix = ""): string {
  const raw =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix + raw.slice(0, 16);
}
