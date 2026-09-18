/**
 * Stage 8B tests — hybrid search composition (pure functions).
 *
 * Covers: cached-store matching, merging cached+remote results, and
 * deduplication by barcode / brand+name with the documented priority
 * (local/user > cached OFF > remote OFF).
 */
import { describe, expect, it } from "vitest";
import {
  dedupeAgainstLocal,
  mergeOffResults,
  normalizeSearchText,
  searchOffCache,
} from "../hybrid-search";
import type { BrandedProduct, FoodProduct } from "../types";

function branded(
  overrides: Partial<BrandedProduct> & Pick<BrandedProduct, "id" | "name">,
): BrandedProduct {
  return {
    type: "branded",
    category: "dairy",
    aliases: [],
    calories: 100,
    protein: 5,
    fat: 3,
    carbs: 12,
    baseUnit: "g",
    units: [],
    servingOptions: [],
    defaultServing: { amount: 100, unitKey: "g" },
    sourceType: "open_food_facts",
    isBranded: true,
    ...overrides,
  };
}

function localFood(
  overrides: Partial<FoodProduct> & Pick<FoodProduct, "id" | "name">,
): FoodProduct {
  return {
    type: "generic",
    category: "dairy",
    aliases: [],
    calories: 90,
    protein: 8,
    fat: 4,
    carbs: 3,
    baseUnit: "g",
    units: [],
    servingOptions: [],
    defaultServing: { amount: 100, unitKey: "g" },
    sourceType: "generic",
    isBranded: false,
    ...overrides,
  } as FoodProduct;
}

const DANISSIMO_REMOTE = branded({
  id: "off-4600605017265",
  name: "Даниссимо Творожный с сочным киви 130г",
  brand: "Даниссимо",
  barcode: "4600605017265",
});

describe("normalizeSearchText", () => {
  it("folds case, ё→е, punctuation and whitespace", () => {
    expect(normalizeSearchText("  Ёлка-«Дружба» ёлка! ")).toBe(
      "елка дружба елка",
    );
  });
});

describe("searchOffCache", () => {
  const cache = [
    DANISSIMO_REMOTE,
    branded({ id: "off-2", name: "Молоко Домик в деревне", brand: "Домик в деревне", barcode: "4690228007842" }),
    branded({ id: "off-3", name: "Кефир", brand: "Простоквашино" }),
  ];

  it("matches by name (case- and ё-insensitive)", () => {
    const results = searchOffCache(cache, "даниссимо творожный", "all");
    expect(results.map((p) => p.id)).toEqual(["off-4600605017265"]);
  });

  it("matches by brand", () => {
    const results = searchOffCache(cache, "простоквашино", "all");
    expect(results.map((p) => p.id)).toEqual(["off-3"]);
  });

  it("matches by exact barcode", () => {
    const results = searchOffCache(cache, "4690228007842", "all");
    expect(results.map((p) => p.id)).toEqual(["off-2"]);
  });

  it("applies the local category filter (option A)", () => {
    const soda = branded({ id: "off-4", name: "Кола", brand: "Cola", category: "drinks" });
    // «ко» matches «Молоко Домик в деревне» (dairy) and «Кола» (drinks);
    // with the dairy filter only the milk remains.
    const results = searchOffCache([...cache, soda], "ко", "dairy");
    expect(results.map((p) => p.id)).toEqual(["off-2"]);
    const all = searchOffCache([...cache, soda], "ко", "all");
    expect(all.map((p) => p.id)).toContain("off-4");
  });

  it("returns nothing for an empty query", () => {
    expect(searchOffCache(cache, "  ", "all")).toEqual([]);
  });
});

describe("mergeOffResults", () => {
  it("deduplicates by barcode — cached wins over remote", () => {
    const cached = branded({
      id: "off-4600605017265",
      name: "Кешированный Даниссимо",
      barcode: "4600605017265",
    });
    const remote = [
      DANISSIMO_REMOTE,
      branded({ id: "off-9", name: "Другой продукт", barcode: "4609999999999" }),
    ];
    const merged = mergeOffResults([cached], remote);
    expect(merged).toHaveLength(2);
    expect(merged[0].name).toBe("Кешированный Даниссимо");
    expect(merged.some((p) => p.barcode === "4600605017265")).toBe(true);
    expect(merged.filter((p) => p.barcode === "4600605017265")).toHaveLength(1);
  });

  it("falls back to brand+name when barcodes are absent", () => {
    const a = branded({ id: "off-1", name: "Творог", brand: "Простоквашино" });
    const b = branded({ id: "off-2", name: "творог", brand: "простоквашино" });
    const merged = mergeOffResults([a], [b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("off-1");
  });

  it("does not merge products with the same name but different brands", () => {
    const a = branded({ id: "off-1", name: "Молоко", brand: "Домик" });
    const b = branded({ id: "off-2", name: "Молоко", brand: "Простоквашино" });
    expect(mergeOffResults([a], [b])).toHaveLength(2);
  });
});

describe("dedupeAgainstLocal", () => {
  it("local product wins over a remote duplicate by barcode", () => {
    const userProduct = localFood({
      type: "user",
      id: "user-1",
      name: "Мой Даниссимо",
      sourceType: "user",
      barcode: "4600605017265",
      isBranded: true,
      brand: "Даниссимо",
    }) as FoodProduct;
    const off = [DANISSIMO_REMOTE, branded({ id: "off-x", name: "Кефир" })];
    const result = dedupeAgainstLocal([userProduct], off);
    expect(result.map((p) => p.id)).toEqual(["off-x"]);
  });

  it("falls back to brand+name when the local product has no barcode", () => {
    const userProduct = localFood({
      id: "user-2",
      name: "Даниссимо Творожный с сочным киви 130г",
      brand: "Даниссимо",
    });
    const result = dedupeAgainstLocal([userProduct], [DANISSIMO_REMOTE]);
    expect(result).toHaveLength(0);
  });

  it("keeps OFF products that only exist remotely", () => {
    const local = [localFood({ id: "g-1", name: "Творог" })];
    const off = [DANISSIMO_REMOTE];
    expect(dedupeAgainstLocal(local, off)).toHaveLength(1);
  });
});
