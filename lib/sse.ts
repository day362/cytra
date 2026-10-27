/**
 * Minimal, spec-compliant Server-Sent Events reader.
 * Yields the joined `data:` payload of each event; ignores comments and
 * other fields. Used for both the upstream OpenAI-compatible stream and our
 * own /api/chat stream.
 */
export async function* readSSE(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];

  const onAbort = () => reader.cancel().catch(() => {});
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.search(/\r\n|\r|\n/)) !== -1) {
        const line = buffer.slice(0, newline);
        const sepLength = buffer.startsWith("\r\n", newline) ? 2 : 1;
        buffer = buffer.slice(newline + sepLength);

        if (line === "") {
          if (data.length) yield data.join("\n");
          data = [];
        } else if (line.startsWith("data:")) {
          data.push(line.slice(line.charAt(5) === " " ? 6 : 5));
        }
        // `event:`, `id:`, `retry:` and `:` comments are not needed here.
      }
    }
    buffer += decoder.decode();
    if (buffer.startsWith("data:")) data.push(buffer.slice(buffer.charAt(5) === " " ? 6 : 5));
    if (data.length) yield data.join("\n");
  } finally {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}

export function encodeSSE(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}
