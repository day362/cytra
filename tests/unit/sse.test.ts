import { describe, expect, it } from "vitest";
import { encodeSSE, readSSE } from "@/lib/sse";
import { collect, streamOf } from "./helpers";

describe("readSSE", () => {
  it("joins events split across arbitrary chunk boundaries", async () => {
    const events = await collect(readSSE(streamOf('data: {"a"', ":1}\n", "\ndata: two\n\n")));
    expect(events).toEqual(['{"a":1}', "two"]);
  });

  it("handles CRLF line endings, multi-line data and comments", async () => {
    const events = await collect(readSSE(streamOf(": keep-alive\r\n\r\ndata: line1\r\ndata: line2\r\n\r\n")));
    expect(events).toEqual(["line1\nline2"]);
  });

  it("flushes a final event without a trailing blank line", async () => {
    expect(await collect(readSSE(streamOf("data: last")))).toEqual(["last"]);
  });

  it("round-trips encodeSSE output", async () => {
    const bytes = encodeSSE({ type: "text", delta: "中文 ok" });
    const events = await collect(readSSE(streamOf(new TextDecoder().decode(bytes))));
    expect(JSON.parse(events[0])).toEqual({ type: "text", delta: "中文 ok" });
  });
});
