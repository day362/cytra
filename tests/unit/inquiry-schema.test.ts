import { describe, expect, it } from "vitest";
import { fieldErrors, inquirySchema } from "@/lib/inquiry/schema";

const valid = {
  kind: "rfq",
  material: "CHO 培养基",
  grade: "GMP",
  quantity: "2000 L / 年",
  documents: ["CoA"],
  name: "张三",
  company: "示例药业",
  email: "zhang@example.com",
  phone: "",
  consent: true,
  website: "",
  startedAt: 1,
};

describe("inquirySchema", () => {
  it("accepts a complete submission and normalises empty optionals", () => {
    const parsed = inquirySchema.parse(valid);
    expect(parsed.phone).toBeUndefined();
    expect(parsed.suppliers).toEqual([]);
  });

  it("reports field-level errors in Chinese", () => {
    const result = inquirySchema.safeParse({ ...valid, email: "bad", consent: false, material: "" });
    expect(result.success).toBe(false);
    const errors = fieldErrors(result.error!);
    expect(errors.email).toBe("邮箱格式不正确");
    expect(errors.consent).toBe("请阅读并同意隐私政策");
    expect(errors.material).toBe("请填写原料名称");
  });

  it("rejects unknown document types", () => {
    expect(inquirySchema.safeParse({ ...valid, documents: ["假证书"] }).success).toBe(false);
  });
});
