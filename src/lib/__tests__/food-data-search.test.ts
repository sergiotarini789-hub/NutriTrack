/**
 * Stage 8B tests — local search ranking improvements.
 *
 * All foods here are synthetic (local search must stay fast and
 * predictable); the built-in database is exercised by the existing
 * food-data tests, which must keep passing unchanged.
 */
import { describe, expect, it } from "vitest";
import { ALL_CATEGORY, searchFoods } from "../food-data";
import type { FoodProduct } from "../types";

function food(
  overrides: Partial<FoodProduct> & Pick<FoodProduct, "id" | "name">,
): FoodProduct {
  return {
    type: "generic",
    category: "dairy",
    aliases: [],
    calories: 50,
    protein: 5,
    fat: 1,
    carbs: 5,
    baseUnit: "g",
    units: [],
    servingOptions: [],
    defaultServing: { amount: 100, unitKey: "g" },
    sourceType: "generic",
    isBranded: false,
    ...overrides,
  } as FoodProduct;
}

const LIST: FoodProduct[] = [
  food({ id: "exact", name: "Молоко" }),
  food({
    id: "brand-exact",
    name: "Йогурт",
    brand: "Снежный",
    isBranded: true,
  }),
  food({ id: "name-prefix", name: "Молочный коктейль" }),
  food({
    id: "brand-prefix",
    name: "Коктейль",
    brand: "Снежный бор",
    isBranded: true,
  }),
  food({ id: "alias-prefix", name: "Картофель", aliases: ["картошка"] }),
  food({ id: "name-substring", name: "Кокосовая стружка" }),
  food({ id: "alias-substring", name: "Фрукт", aliases: ["бананчик"] }),
  food({ id: "category-match", name: "Кефир", category: "dairy" }),
];

describe("searchFoods ranking (Stage 8B)", () => {
  it("exact product name ranks first", () => {
    const results = searchFoods(LIST, "молоко");
    expect(results[0].id).toBe("exact");
  });

  it("exact brand ranks second", () => {
    const results = searchFoods(LIST, "снежный");
    expect(results[0].id).toBe("brand-exact"); // exact brand beats prefix brand
    expect(results.map((f) => f.id)).toContain("brand-prefix");
  });

  it("name starts-with beats brand starts-with beats substring", () => {
    // Categories that do NOT contain the query keep the tiers isolated.
    const list = [
      food({ id: "exact", name: "Молоко", category: "meat" }),
      food({ id: "brand-exact", name: "Йогурт", brand: "Молочная лавка", isBranded: true, category: "meat" }),
      food({ id: "name-prefix", name: "Молочный коктейль", category: "meat" }),
      food({ id: "brand-prefix", name: "Коктейль", brand: "Молочный двор", isBranded: true, category: "meat" }),
      food({ id: "name-substring", name: "Кокосовая стружка с молоком", category: "meat" }),
    ];
    const results = searchFoods(list, "мол");
    expect(results.map((f) => f.id)).toEqual([
      "exact",
      "name-prefix",
      "brand-exact",
      "brand-prefix",
      "name-substring",
    ]);
  });

  it("alias starts-with ranks above substrings", () => {
    const results = searchFoods(LIST, "картош");
    expect(results[0].id).toBe("alias-prefix");
  });

  it("alias substring matches near the end", () => {
    const results = searchFoods(LIST, "нанчик");
    expect(results.map((f) => f.id)).toEqual(["alias-substring"]);
  });

  it("category-name matches rank last but still work", () => {
    const results = searchFoods(LIST, "молочные продукты");
    // Items whose own text does not match still surface through their
    // category name («Молочные продукты») at the lowest rank.
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((f) => f.id)).toContain("category-match");
  });

  it("normalizes case, ё/е and punctuation on both sides", () => {
    const list = [
      food({ id: "yo", name: "Ёлки-палки" }),
      food({ id: "plain", name: "Кефир 3,2%" }),
    ];
    expect(searchFoods(list, "ёлки")[0].id).toBe("yo");
    expect(searchFoods(list, "елки")[0].id).toBe("yo");
    expect(searchFoods(list, "КЕФИР 3.2%")[0].id).toBe("plain");
  });

  it("keeps the category filter active", () => {
    const meat = food({ id: "meat-mol", name: "Молочный поросёнок", category: "meat" });
    const results = searchFoods([meat, ...LIST], "молочный", "dairy");
    expect(results.map((f) => f.id)).toEqual(["name-prefix"]);
    const all = searchFoods([meat, ...LIST], "молочный", ALL_CATEGORY);
    // Stable sort keeps the input order for equal ranks.
    expect(all.map((f) => f.id)).toEqual(["meat-mol", "name-prefix"]);
  });

  it("returns the unfiltered category list for an empty query", () => {
    const results = searchFoods(LIST, "", "dairy");
    expect(results).toHaveLength(LIST.length); // all synthetic items are dairy
  });
});
