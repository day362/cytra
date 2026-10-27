import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once. Nothing here is ever sent to the
 * browser: none of these names use the NEXT_PUBLIC_ prefix.
 */
const schema = z.object({
  CYTRA_API_BASE_URL: z
    .url()
    .optional()
    .transform((v) => v?.replace(/\/+$/, "")),
  CYTRA_API_KEY: z.string().min(1).optional(),
  /** JSON object mapping public model ids to upstream model names. */
  CYTRA_MODEL_MAP: z.string().optional(),
  /** Comma-separated public model ids this upstream can serve, e.g. "cytra-bio,deepseek". Empty = all. */
  CYTRA_ENABLED_MODELS: z.string().optional(),
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
  cached = { ...parsed.data, demoMode: !parsed.data.CYTRA_API_BASE_URL || !parsed.data.CYTRA_API_KEY };
  return cached;
}
