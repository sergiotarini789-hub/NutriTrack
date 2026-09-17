import { describe, expect, it } from "vitest";
import { CATEGORIES, foods, searchFoods } from "../food-data";
import type { UserProduct } from "../types";

describe("built-in food database", () => {
  it("keeps all 273 foods", () => {
    expect(foods).toHaveLength(273);
  });

  it("has unique ids", () => {
    const ids = new Set(foods.map((food) => food.id));
    expect(ids.size).toBe(foods.length);
  });

  it("marks every built-in food as a generic reference food", () => {
    for (const food of foods) {
      expect(food.type).toBe("generic");
      expect(food.sourceType).toBe("generic");
      expect(food.isBranded).toBe(false);
      // Generic foods must not carry manufacturer metadata.
      expect(food.brand).toBeUndefined();
      expect(food.barcode).toBeUndefined();
    }
  });

  it("has at least 17 named categories", () => {
    const realCategories = CATEGORIES.filter((c) => c.id !== "user");
    expect(realCategories.length).toBeGreaterThanOrEqual(17);
  });
});

describe("search", () => {
  it("finds by name prefix", () => {
    const results = searchFoods(foods, "греч");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].name.toLowerCase().startsWith("греч")).toBe(true);
  });

  it("matches aliases (картошка -> Картофель)", () => {
    const results = searchFoods(foods, "картошка");
    expect(results.some((food) => food.name.includes("Картофель"))).toBe(true);
  });

  it("matches category names (напитки)", () => {
    const results = searchFoods(foods, "напитки");
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it("searches across generic and user products", () => {
    const userProduct: UserProduct = {
      type: "user",
      id: "user-x",
      name: "Мой супер-творог",
      category: "user",
      aliases: [],
      calories: 100,
      protein: 10,
      fat: 1,
      carbs: 1,
      baseUnit: "g",
      units: [{ key: "g", kind: "g", label: "г", base: 1 }],
      servingOptions: [{ amount: 100, unitKey: "g" }],
      defaultServing: { amount: 100, unitKey: "g" },
      sourceType: "user",
      isBranded: false,
    };
    const combined = [userProduct, ...foods];
    const results = searchFoods(combined, "творог");
    expect(results.some((food) => food.id === "user-x")).toBe(true);
    expect(results.some((food) => food.id === "cottage-cheese")).toBe(true);
  });

  it("matches brand when present", () => {
    const brandedLike: UserProduct = {
      type: "user",
      id: "user-b",
      name: "Йогурт",
      category: "user",
      aliases: [],
      calories: 70,
      protein: 5,
      fat: 2,
      carbs: 8,
      baseUnit: "g",
      units: [{ key: "g", kind: "g", label: "г", base: 1 }],
      servingOptions: [{ amount: 100, unitKey: "g" }],
      defaultServing: { amount: 100, unitKey: "g" },
      sourceType: "user",
      isBranded: true,
      brand: "Снежный",
    };
    const results = searchFoods([brandedLike, ...foods], "снежный");
    expect(results.some((food) => food.id === "user-b")).toBe(true);
  });
});
