import demoData from "@/data/suppliers.demo.json";
import type { Supplier, SupplierQuery, SupplierResult } from "./types";

/**
 * The single seam between the assistant and supplier data.
 * Swap MockSupplierRepository for a database- or search-backed implementation
 * without touching the chat pipeline.
 */
export interface SupplierRepository {
  search(query: SupplierQuery, limit?: number): Promise<SupplierResult>;
}

/** Split a free-text material query into matchable tokens (CJK + latin aware). */
export function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const latin = lower.match(/[a-z0-9][a-z0-9.+\-/]*/g) ?? [];
  const cjk = lower.replace(/[a-z0-9.+\-/\s]+/g, " ").split(/[\s,，、/]+/).filter(Boolean);
  return [...new Set([...latin, ...cjk])];
}

function score(supplier: Supplier, query: SupplierQuery): number {
  const haystack = [...supplier.keywords, ...supplier.categories, ...supplier.products.map((p) => p.name)]
    .join(" ")
    .toLowerCase();
  let s = 0;
  for (const token of tokenize(query.material)) {
    if (haystack.includes(token)) s += token.length >= 2 ? 3 : 1;
    // Partial CJK overlap (e.g. "CHO培养基" vs "培养基").
    else if (/[一-鿿]/.test(token)) {
      for (const kw of supplier.keywords) if (token.includes(kw.toLowerCase())) s += 2;
    }
  }
  return s;
}

export class MockSupplierRepository implements SupplierRepository {
  constructor(private readonly data: Supplier[] = demoData as Supplier[]) {}

  async search(query: SupplierQuery, limit = 4): Promise<SupplierResult> {
    const ranked = this.data
      .map((supplier) => ({ supplier, s: score(supplier, query) }))
      .filter(({ supplier, s }) => {
        if (s <= 0) return false;
        if (query.region && query.region !== "不限" && supplier.region !== query.region) return false;
        const products = supplier.products.filter(
          (p) =>
            (!query.grade || query.grade === "不限" || p.grade === query.grade) &&
            (!query.animal_origin_free || p.animalOriginFree),
        );
        return products.length > 0;
      })
      .sort((a, b) => b.s - a.s || a.supplier.leadTimeWeeks[0] - b.supplier.leadTimeWeeks[0])
      .slice(0, limit)
      .map(({ supplier }) => supplier);

    return { query, suppliers: ranked, demo: true };
  }
}

let instance: SupplierRepository | undefined;
export function getSupplierRepository(): SupplierRepository {
  instance ??= new MockSupplierRepository();
  return instance;
}
