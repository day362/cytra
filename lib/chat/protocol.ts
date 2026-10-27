import { z } from "zod";
import { MODEL_IDS, type ModelId } from "@/config/models";
import type { SupplierResult } from "@/lib/suppliers/types";
import { MAX_INPUT_CHARS } from "./limits";

/**
 * Wire protocol between /api/chat and the browser.
 * Each SSE `data:` line carries exactly one StreamEvent as JSON.
 */
export type StreamEvent =
  | { type: "meta"; demo: boolean; model: ModelId }
  | { type: "text"; delta: string }
  | { type: "suppliers"; result: SupplierResult }
  | { type: "done"; reason: "stop" | "length" | "tool_limit" }
  | { type: "error"; code: ChatErrorCode; message: string };

export type ChatErrorCode = "rate_limited" | "bad_request" | "upstream" | "timeout" | "internal";

const messageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(MAX_INPUT_CHARS) }),
  // Assistant turns come back from the client's own history; bounded, not trusted as instructions.
  z.object({ role: z.literal("assistant"), content: z.string().max(24_000) }),
]);

export const chatRequestSchema = z
  .object({
    model: z.enum(MODEL_IDS),
    messages: z.array(messageSchema).min(1).max(200),
  })
  .refine((body) => body.messages.at(-1)?.role === "user", {
    message: "最后一条消息必须来自用户",
    path: ["messages"],
  });

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type WireMessage = ChatRequest["messages"][number];
