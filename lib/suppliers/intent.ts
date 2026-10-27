import type { SupplierQuery } from "./types";

/**
 * Lightweight, rule-based reading of a user message: is it asking for
 * suppliers, and for what? Used where the model itself cannot call the
 * supplier tool (demo mode, local OpenCode mode).
 */

export const SUPPLIER_INTENT = /厂家|厂商|供应商|供货|哪家|询价|采购渠道|supplier|vendor/i;

const KNOWN_MATERIALS = [
  "Protein A",
  "胰蛋白酶",
  "核酸酶",
  "培养基",
  "填料",
  "蔗糖",
  "海藻糖",
  "聚山梨酯",
  "储液袋",
  "生物反应器袋",
  "过滤器",
  "IL-2",
  "生长因子",
  "血清",
];

export function detectMaterial(text: string): string {
  const lower = text.toLowerCase();
  const hit = KNOWN_MATERIALS.find((k) => lower.includes(k.toLowerCase()));
  if (hit) return /CHO/i.test(text) && hit === "培养基" ? "CHO 培养基" : hit;
  return text.replace(/[，。？！?!,.]/g, " ").trim().slice(0, 20);
}

/** Returns a supplier query when the message asks for suppliers, otherwise null. */
export function supplierQueryFrom(text: string): SupplierQuery | null {
  if (!SUPPLIER_INTENT.test(text)) return null;
  const grade = /GMP/i.test(text) ? "GMP" : /药用|注射级/.test(text) ? "药用级" : undefined;
  const aof = /无动物源|AOF|animal[- ]?free|化学成分限定/i.test(text) || undefined;
  return { material: detectMaterial(text), grade, animal_origin_free: aof };
}
