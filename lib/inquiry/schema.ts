import { z } from "zod";
import { GRADES } from "@/lib/suppliers/types";

export const DOCUMENT_OPTIONS = ["CoA", "CoO", "TSE/BSE 声明", "无动物源声明", "DMF 授权信", "变更通知协议"] as const;

/** Submissions faster than this after the form opened are treated as bots. */
export const MIN_FILL_MS = 2000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `不超过 ${max} 字`)
    .optional()
    .transform((v) => v || undefined);

export const inquirySchema = z.object({
  kind: z.enum(["rfq", "contact"]),
  material: z.string().trim().min(1, "请填写原料名称").max(120, "不超过 120 字"),
  specification: optionalText(300),
  grade: z.enum(GRADES),
  quantity: z.string().trim().min(1, "请填写用量").max(60, "不超过 60 字"),
  documents: z.array(z.enum(DOCUMENT_OPTIONS)).max(DOCUMENT_OPTIONS.length),
  deliveryBy: optionalText(20),
  suppliers: z
    .array(z.object({ id: z.string().max(60), name: z.string().max(80) }))
    .max(10)
    .default([]),
  name: z.string().trim().min(1, "请填写姓名").max(40, "不超过 40 字"),
  company: z.string().trim().min(1, "请填写公司或机构").max(80, "不超过 80 字"),
  email: z.email("邮箱格式不正确").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+\d][\d\s-]{5,19}$/, "电话格式不正确")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: optionalText(1000),
  consent: z.literal(true, { error: "请阅读并同意隐私政策" }),
  /** Honeypot: hidden from humans, must stay empty. */
  website: z.string().max(200).optional(),
  startedAt: z.number().int().positive(),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type Inquiry = z.output<typeof inquirySchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
