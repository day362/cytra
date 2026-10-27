/**
 * Relay (模型中转) catalogue shown on /relay.
 * Prices are ILLUSTRATIVE placeholders — replace with real contracted rates.
 */
export const RELAY_BASE_URL = "https://api.cytra.example/v1";

export type RelayModel = {
  name: string;
  vendor: string;
  context: string;
  input: number; // CNY per 1M input tokens
  output: number; // CNY per 1M output tokens
  tags: string[];
};

export const RELAY_MODELS: RelayModel[] = [
  { name: "cytra-bio", vendor: "胞序", context: "128K", input: 8, output: 24, tags: ["专属", "厂家库"] },
  { name: "gpt-4.1", vendor: "OpenAI", context: "1M", input: 14, output: 56, tags: ["通用"] },
  { name: "claude-sonnet-5-5", vendor: "Anthropic", context: "200K", input: 21, output: 105, tags: ["长文档", "分析"] },
  { name: "gemini-2.5-pro", vendor: "Google", context: "1M", input: 9, output: 72, tags: ["多模态"] },
  { name: "deepseek-chat", vendor: "深度求索", context: "128K", input: 2, output: 8, tags: ["高性价比"] },
  { name: "qwen-plus", vendor: "通义千问", context: "128K", input: 0.8, output: 2, tags: ["中文"] },
];
