/**
 * Stage 8B tests — unknown vs zero nutrition.
 *
 * Covers: hasNutrition, arithmetic with unknown values (contributes 0
 * to totals but is labeled unknown), the exact 65 g / 130 g Danissimo
 * calculation from the spec, and parsing of OFF store records without
 * nutrition (localStorage resilience).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hasNutrition,
  nutritionForServing,
  nutritionOf,
} from "../nutrition";
import { loadOffProducts, saveOffProducts, STORAGE_KEYS } from "../storage";
import type { BrandedProduct, UserProduct } from "../types";

const DANISSIMO: BrandedProduct = {
  type: "branded",
  id: "off-4600605017265",
  name: "Даниссимо Творожный с сочным киви 130г",
  category: "dairy",
  aliases: [],
  calories: 135,
  protein: 5.5,
  fat: 5.5,
  carbs: 15.8,
  baseUnit: "g",
  units: [{ key: "g", kind: "g", label: "г", base: 1 }],
  servingOptions: [{ amount: 100, unitKey: "g" }],
  defaultServing: { amount: 100, unitKey: "g" },
  sourceType: "open_food_facts",
  sourceId: "4600605017265",
  isBranded: true,
  brand: "Даниссимо",
  barcode: "4600605017265",
  verified: false,
};

const NO_NUTRITION: BrandedProduct = {
  ...DANISSIMO,
  id: "off-4602222222222",
  name: "Продукт без КБЖУ",
  barcode: "4602222222222",
  calories: undefined,
  protein: undefined,
  fat: undefined,
  carbs: undefined,
};

describe("hasNutrition", () => {
  it("is true for products with nutrition", () => {
    expect(hasNutrition(DANISSIMO)).toBe(true);
  });

  it("is false for external products without nutrition", () => {
    expect(hasNutrition(NO_NUTRITION)).toBe(false);
  });

  it("is true for a real zero (0 kcal is still data)", () => {
    expect(hasNutrition({ ...DANISSIMO, calories: 0 })).toBe(true);
  });
});

describe("arithmetic with unknown nutrition", () => {
  it("contributes zeros to totals (documented semantics)", () => {
    const per100 = nutritionOf(NO_NUTRITION);
    expect(per100).toEqual({ calories: 0, protein: 0, fat: 0, carbs: 0 });
    const serving = nutritionForServing(NO_NUTRITION, 200, "g");
    expect(serving.calories).toBe(0);
  });

  it("does not confuse a real zero with unknown", () => {
    const realZero = { ...DANISSIMO, calories: 0, protein: 0, fat: 0, carbs: 0 };
    expect(hasNutrition(realZero)).toBe(true);
    expect(nutritionOf(realZero)).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
  });
});

describe("remote product nutrition calculation (spec example)", () => {
  it("65 g of Danissimo 130 g is exactly 50% of per-100g values", () => {
    const for65 = nutritionForServing(DANISSIMO, 65, "g");
    expect(for65.calories).toBe(87.8); // 135 * 0.65
    expect(for65.protein).toBe(3.6); // 5.5 * 0.65 → 3.575 → 3.6
    expect(for65.fat).toBe(3.6);
    expect(for65.carbs).toBe(10.3); // 15.8 * 0.65 → 10.27 → 10.3
  });

  it("user products keep exact arithmetic (regression)", () => {
    const user: UserProduct = {
      type: "user",
      id: "user-1",
      name: "Мой продукт",
      category: "user",
      aliases: [],
      calories: 200,
      protein: 10,
      fat: 8,
      carbs: 20,
      baseUnit: "g",
      units: [{ key: "g", kind: "g", label: "г", base: 1 }],
      servingOptions: [{ amount: 100, unitKey: "g" }],
      defaultServing: { amount: 100, unitKey: "g" },
      sourceType: "user",
      isBranded: false,
    };
    expect(nutritionForServing(user, 50, "g").calories).toBe(100);
  });
});

/* ------------------------- localStorage store ------------------------- */

class LocalStorageMock {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

let storage: LocalStorageMock;

beforeEach(() => {
  storage = new LocalStorageMock();
  (globalThis as Record<string, unknown>).window = { localStorage: storage };
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

describe("OFF product store with unknown nutrition", () => {
  it("persists and reloads a nutritionless OFF product", () => {
    saveOffProducts([NO_NUTRITION]);
    const loaded = loadOffProducts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("off-4602222222222");
    expect(loaded[0].calories).toBeUndefined();
    expect(loaded[0].protein).toBeUndefined();
  });

  it("round-trips a complete OFF product unchanged", () => {
    saveOffProducts([DANISSIMO]);
    const loaded = loadOffProducts();
    expect(loaded[0]).toEqual(DANISSIMO);
  });

  it("rejects a record with malformed calories (not silently zeroed)", () => {
    storage.setItem(
      STORAGE_KEYS.offProducts,
      JSON.stringify([
        { ...DANISSIMO, calories: "много" },
      ]),
    );
    expect(loadOffProducts()).toEqual([]);
  });

  it("rejects a record with partial nutrition garbage", () => {
    storage.setItem(
      STORAGE_KEYS.offProducts,
      JSON.stringify([{ ...NO_NUTRITION, protein: 5 }]),
    );
    expect(loadOffProducts()).toEqual([]);
  });

  it("survives corrupted localStorage content", () => {
    storage.setItem(STORAGE_KEYS.offProducts, "{{{not json");
    expect(loadOffProducts()).toEqual([]);
  });
});
