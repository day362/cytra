import "server-only";
import { z } from "zod";
import { MODEL_IDS, type ModelId } from "@/config/models";
import { getServerEnv } from "@/lib/env";

/**
 * Default upstream names. Relay providers name models differently, so every
 * deployment is expected to override these through CYTRA_MODEL_MAP, e.g.
 * CYTRA_MODEL_MAP='{"cytra-bio":"your-finetune","gpt":"gpt-4.1"}'
 */
const DEFAULTS: Record<ModelId, string> = {
  "cytra-bio": "gpt-4.1",
  gpt: "gpt-4.1",
  claude: "claude-sonnet-5-5",
  gemini: "gemini-2.5-pro",
  deepseek: "deepseek-chat",
  qwen: "qwen-plus",
};

const mapSchema = z.partialRecord(z.enum(MODEL_IDS), z.string().min(1));
let resolved: Record<ModelId, string> | undefined;

export function upstreamModel(id: ModelId): string {
  if (!resolved) {
    const raw = getServerEnv().CYTRA_MODEL_MAP;
    let overrides = {};
    if (raw) {
      const parsed = mapSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) throw new Error(`CYTRA_MODEL_MAP is invalid: ${z.prettifyError(parsed.error)}`);
      overrides = parsed.data;
    }
    resolved = { ...DEFAULTS, ...overrides };
  }
  return resolved[id];
}
