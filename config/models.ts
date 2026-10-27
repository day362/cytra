/**
 * Public model catalogue — safe to ship to the browser.
 * The upstream model name each entry maps to lives server-side only
 * (see lib/llm/model-routing.ts) so it can change without a redeploy of
 * client code and is never exposed.
 */

export const MODEL_IDS = ["cytra-bio", "gpt", "claude", "gemini", "deepseek", "qwen"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export type ModelOption = {
  id: ModelId;
  name: string;
  vendor: string;
  group: "dedicated" | "relay";
  tagline: string;
  /** Dedicated model can query the supplier directory. */
  supplierTools: boolean;
};

export const MODELS: readonly ModelOption[] = [
  {
    id: "cytra-bio",
    name: "Cytra Bio",
    vendor: "胞序",
    group: "dedicated",
    tagline: "生物制药原料专属 · 可检索厂家库",
    supplierTools: true,
  },
  { id: "gpt", name: "GPT", vendor: "OpenAI", group: "relay", tagline: "通用推理与写作", supplierTools: false },
  { id: "claude", name: "Claude", vendor: "Anthropic", group: "relay", tagline: "长文档与严谨分析", supplierTools: false },
  { id: "gemini", name: "Gemini", vendor: "Google", group: "relay", tagline: "多模态与长上下文", supplierTools: false },
  { id: "deepseek", name: "DeepSeek", vendor: "深度求索", group: "relay", tagline: "中文推理，高性价比", supplierTools: false },
  { id: "qwen", name: "Qwen", vendor: "通义千问", group: "relay", tagline: "中文场景与工具调用", supplierTools: false },
];

export const DEFAULT_MODEL: ModelId = "cytra-bio";

export function getModel(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}
