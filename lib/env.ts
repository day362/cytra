import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once. Nothing here is ever sent to the
 * browser: none of these names use the NEXT_PUBLIC_ prefix.
 */
const schema = z.object({
  /**
   * "api": any OpenAI-compatible endpoint with a key (deployable).
   * "opencode": a local `opencode serve` instance on this machine (local only).
   */
  CYTRA_PROVIDER: z.enum(["api", "opencode"]).default("api"),
  CYTRA_API_BASE_URL: z
    .url()
    .optional()
    .transform((v) => v?.replace(/\/+$/, "")),
  CYTRA_API_KEY: z.string().min(1).optional(),
  /** JSON object mapping public model ids to upstream model names. */
  CYTRA_MODEL_MAP: z.string().optional(),
  /** Comma-separated public model ids this upstream can serve, e.g. "cytra-bio,deepseek". Empty = all. */
  CYTRA_ENABLED_MODELS: z.string().optional(),
  OPENCODE_URL: z
    .url()
    .default("http://127.0.0.1:4096")
    .transform((v) => v.replace(/\/+$/, "")),
  /** provider/model as listed by `opencode models`. */
  OPENCODE_MODEL: z
    .string()
    .regex(/^[^/\s]+\/[^\s]+$/, "格式应为 provider/model，例如 opencode/deepseek-v4.1-flash-free")
    .default("opencode/deepseek-v4.1-flash-free"),
  /** Set when `opencode serve` runs with OPENCODE_SERVER_PASSWORD. */
  OPENCODE_SERVER_PASSWORD: z.string().min(1).optional(),
  INQUIRY_WEBHOOK_URL: z.url().optional(),
  RATE_LIMIT_CHAT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_INQUIRY_PER_HOUR: z.coerce.number().int().positive().default(10),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
});

export type ServerEnv = z.infer<typeof schema> & { demoMode: boolean };

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  // Treat empty strings (common in .env files) as unset.
  const raw = Object.fromEntries(Object.keys(schema.shape).map((k) => [k, process.env[k] || undefined]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid server environment:\n${z.prettifyError(parsed.error)}`);
  }
  const data = parsed.data;
  const demoMode = data.CYTRA_PROVIDER === "api" && (!data.CYTRA_API_BASE_URL || !data.CYTRA_API_KEY);
  cached = { ...data, demoMode };
  return cached;
}
