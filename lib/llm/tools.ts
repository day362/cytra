import { GRADES, REGIONS, supplierQuerySchema, type SupplierResult } from "@/lib/suppliers/types";
import type { SupplierRepository } from "@/lib/suppliers/repository";
import type { ToolDefinition } from "./openai-compatible";

export const SEARCH_SUPPLIERS = "search_suppliers";

export const supplierTool: ToolDefinition = {
  type: "function",
  function: {
    name: SEARCH_SUPPLIERS,
    description:
      "检索胞序厂家库，返回能供应指定原料的厂家及其等级、资质文件、货期与起订量。用户想找厂家、比较供应商或询价时调用。",
    parameters: {
      type: "object",
      properties: {
        material: { type: "string", description: "原料名称或类别，如“CHO 化学成分限定培养基”“Protein A 填料”" },
        grade: { type: "string", enum: [...GRADES], description: "质量等级要求" },
        animal_origin_free: { type: "boolean", description: "是否要求无动物源成分" },
        region: { type: "string", enum: [...REGIONS], description: "厂家所在区域偏好" },
      },
      required: ["material"],
      additionalProperties: false,
    },
  },
};

export type ToolOutcome =
  | { ok: true; result: SupplierResult; forModel: string }
  | { ok: false; forModel: string };

/** Executes a tool call. Returns both the UI payload and the compact text sent back to the model. */
export async function runSupplierTool(rawArgs: string, repo: SupplierRepository): Promise<ToolOutcome> {
  let json: unknown;
  try {
    json = JSON.parse(rawArgs);
  } catch {
    return { ok: false, forModel: JSON.stringify({ error: "参数不是合法 JSON" }) };
  }
  const parsed = supplierQuerySchema.safeParse(json);
  if (!parsed.success) return { ok: false, forModel: JSON.stringify({ error: "参数不合法", issues: parsed.error.issues }) };

  const result = await repo.search(parsed.data);
  const forModel = JSON.stringify({
    demo_data: result.demo,
    count: result.suppliers.length,
    suppliers: result.suppliers.map((s) => ({
      name: s.name,
      region: s.region,
      products: s.products.map((p) => `${p.name}（${p.grade}${p.animalOriginFree ? "，AOF" : ""}）`),
      certifications: s.certifications,
      documents: s.documents,
      lead_time_weeks: s.leadTimeWeeks,
      moq: s.moq,
      note: s.note,
    })),
  });
  return { ok: true, result, forModel };
}
