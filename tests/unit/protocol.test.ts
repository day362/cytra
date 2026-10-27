import { describe, expect, it } from "vitest";
import { chatRequestSchema } from "@/lib/chat/protocol";
import { MAX_INPUT_CHARS } from "@/lib/chat/limits";

describe("chatRequestSchema", () => {
  it("accepts a valid request", () => {
    expect(chatRequestSchema.safeParse({ model: "cytra-bio", messages: [{ role: "user", content: "你好" }] }).success).toBe(true);
  });

  it("rejects unknown models, system roles and non-user last turns", () => {
    expect(chatRequestSchema.safeParse({ model: "gpt-5", messages: [{ role: "user", content: "x" }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ model: "gpt", messages: [{ role: "system", content: "x" }] }).success).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        model: "gpt",
        messages: [
          { role: "user", content: "x" },
          { role: "assistant", content: "y" },
        ],
      }).success,
    ).toBe(false);
  });

  it("enforces the input length limit", () => {
    const content = "a".repeat(MAX_INPUT_CHARS + 1);
    expect(chatRequestSchema.safeParse({ model: "gpt", messages: [{ role: "user", content }] }).success).toBe(false);
  });
});
