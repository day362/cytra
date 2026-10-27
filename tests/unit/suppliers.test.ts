import { describe, expect, it } from "vitest";
import { MockSupplierRepository, tokenize } from "@/lib/suppliers/repository";

const repo = new MockSupplierRepository();

describe("tokenize", () => {
  it("splits mixed CJK and latin queries", () => {
    expect(tokenize("CHO 培养基, Protein A")).toEqual(expect.arrayContaining(["cho", "培养基", "protein", "a"]));
  });
});

describe("MockSupplierRepository", () => {
  it("finds media suppliers and marks results as demo data", async () => {
    const result = await repo.search({ material: "CHO 培养基" });
    expect(result.demo).toBe(true);
    expect(result.suppliers.length).toBeGreaterThan(0);
    expect(result.suppliers.every((s) => s.name.startsWith("示例·"))).toBe(true);
  });

  it("filters by grade and animal-origin-free", async () => {
    const result = await repo.search({ material: "Protein A 填料", grade: "GMP", animal_origin_free: true });
    for (const s of result.suppliers) {
      expect(s.products.some((p) => p.grade === "GMP" && p.animalOriginFree)).toBe(true);
    }
    // 曜石's Protein A is RUO only, but it still has other GMP resins: grade filter is per-supplier product line.
    expect(result.suppliers.map((s) => s.id)).toContain("demo-beichen");
  });

  it("filters by region and respects the limit", async () => {
    const result = await repo.search({ material: "培养基", region: "欧洲" }, 1);
    expect(result.suppliers).toHaveLength(1);
    expect(result.suppliers[0].region).toBe("欧洲");
  });

  it("returns nothing for unrelated materials", async () => {
    expect((await repo.search({ material: "火箭燃料" })).suppliers).toEqual([]);
  });
});
