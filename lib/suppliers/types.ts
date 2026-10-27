import { z } from "zod";

export const GRADES = ["GMP", "药用级", "RUO", "不限"] as const;
export const REGIONS = ["中国大陆", "亚太", "欧洲", "北美", "不限"] as const;

export const supplierQuerySchema = z.object({
  material: z.string().trim().min(1).max(80),
  grade: z.enum(GRADES).optional(),
  animal_origin_free: z.boolean().optional(),
  region: z.enum(REGIONS).optional(),
});
export type SupplierQuery = z.infer<typeof supplierQuerySchema>;

export type SupplierProduct = {
  name: string;
  grade: Exclude<(typeof GRADES)[number], "不限">;
  animalOriginFree: boolean;
};

export type Supplier = {
  id: string;
  /** Display name. Demo data is always prefixed with "示例·". */
  name: string;
  region: Exclude<(typeof REGIONS)[number], "不限">;
  city: string;
  categories: string[];
  keywords: string[];
  products: SupplierProduct[];
  certifications: string[];
  documents: string[];
  leadTimeWeeks: [number, number];
  moq: string;
  note: string;
  demo: boolean;
};

export type SupplierResult = {
  query: SupplierQuery;
  suppliers: Supplier[];
  /** True when results come from illustrative data, never real companies. */
  demo: boolean;
};
