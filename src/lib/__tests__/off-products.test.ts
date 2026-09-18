import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findOffProductByBarcode,
  findOffProductById,
  upsertOffProduct,
} from "../off-products";
import { loadOffProducts, STORAGE_KEYS } from "../storage";
import { nutritionForServing } from "../nutrition";
import { foods } from "../food-data";
import { LocalFoodRepository } from "../food-repository";
import type { BrandedProduct, UserProduct } from "../types";

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

/** A normalized OFF product, as the server route would produce it. */
function offProduct(overrides: Partial<BrandedProduct> = {}): BrandedProduct {
  return {
    type: "branded",
    id: "off-4602541000592",
    name: "Творог детский «Агуша» классический 4,5 %",
    category: "dairy",
    aliases: [],
    calories: 89,
    protein: 8.5,
    fat: 4.5,
    carbs: 3.5,
    baseUnit: "g",
    units: [
      { key: "g", kind: "g", label: "г", base: 1 },
      { key: "package", kind: "package", label: "упаковка", few: "упаковки", many: "упаковок", base: 50 },
    ],
    servingOptions: [
      { amount: 50, unitKey: "g" },
      { amount: 100, unitKey: "g" },
      { amount: 150, unitKey: "g" },
    ],
    defaultServing: { amount: 100, unitKey: "g" },
    sourceType: "open_food_facts",
    sourceId: "4602541000592",
    isBranded: true,
    brand: "Агуша",
    barcode: "4602541000592",
    verified: false,
    ...overrides,
  };
}

describe("Open Food Facts product store", () => {
  it("starts empty and does not touch other storage keys", () => {
    expect(loadOffProducts()).toEqual([]);
    expect(storage.getItem(STORAGE_KEYS.userFoods)).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.entries)).toBeNull();
  });

  it("stores a normalized product and finds it by id and barcode", () => {
    upsertOffProduct(offProduct());
    expect(findOffProductById("off-4602541000592")?.name).toContain("Агуша");
    expect(findOffProductByBarcode("4602541000592")?.id).toBe(
      "off-4602541000592",
    );
    // Lookup normalizes the input.
    expect(findOffProductByBarcode(" 460254 100-0592 ")?.id).toBe(
      "off-4602541000592",
    );
  });

  it("upserts idempotently: the same id replaces, never duplicates", () => {
    upsertOffProduct(offProduct());
    upsertOffProduct(offProduct({ name: "Агуша (обновлено)" }));
    const all = loadOffProducts();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Агуша (обновлено)");
  });

  it("keeps different barcodes strictly separate", () => {
    upsertOffProduct(offProduct());
    upsertOffProduct(
      offProduct({
        id: "off-4607053473544",
        name: "Молоко Простоквашино 2,5%",
        barcode: "4607053473544",
        sourceId: "4607053473544",
        brand: "Простоквашино",
      }),
    );
    const all = loadOffProducts();
    expect(all).toHaveLength(2);
    expect(findOffProductByBarcode("4607053473544")?.brand).toBe("Простоквашино");
    expect(findOffProductByBarcode("4602541000592")?.brand).toBe("Агуша");
  });

  it("drops malformed records and rejects non-OFF products on load", () => {
    const junk = [
      "not json would fail earlier — this array entry is an object",
      { id: "off-x" }, // no name
      { id: "off-y", name: "Fake", type: "generic", sourceType: "generic" },
      { id: "off-z", name: "Impostor", type: "user", sourceType: "user" },
    ].filter((entry) => typeof entry === "object");
    storage.setItem(
      STORAGE_KEYS.offProducts,
      JSON.stringify([
        ...junk,
        offProduct({ id: "off-keep", name: "Настоящий" }),
      ]),
    );
    const loaded = loadOffProducts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].sourceType).toBe("open_food_facts");
  });

  it("maps an invalid stored category to the safe fallback", () => {
    storage.setItem(
      STORAGE_KEYS.offProducts,
      JSON.stringify([offProduct({ category: "user" })]),
    );
    expect(loadOffProducts()[0].category).toBe("ready");
  });
});

describe("diary integration with external products", () => {
  it("a FoodEntry references the normalized product and nutrition computes from it", () => {
    upsertOffProduct(offProduct());
    // What addEntry persists: the entry references the product id only.
    const entry = {
      id: "entry-1",
      foodId: "off-4602541000592",
      mealType: "breakfast" as const,
      amount: 200,
      unit: "g",
      date: "2026-09-18",
    };
    const food = findOffProductById(entry.foodId);
    expect(food).toBeDefined();
    const nutrition = nutritionForServing(food!, entry.amount, entry.unit);
    // 89 kcal / 8.5 / 4.5 / 3.5 per 100 g → ×2 for 200 g.
    expect(nutrition).toEqual({
      calories: 178,
      protein: 17,
      fat: 9,
      carbs: 7,
    });
  });

  it("computes nutrition for a package unit of an external product", () => {
    upsertOffProduct(offProduct());
    const food = findOffProductById("off-4602541000592")!;
    const nutrition = nutritionForServing(food, 1, "package");
    expect(nutrition.calories).toBe(44.5); // 89 × 50/100
  });

  it("generic foods remain generic — the local database is untouched", () => {
    // All 273 built-ins stay GenericFood with unchanged values.
    expect(foods).toHaveLength(273);
    expect(foods.every((food) => food.type === "generic")).toBe(true);
    expect(foods.every((food) => food.sourceType === "generic")).toBe(true);
    // Storing an OFF product does not add anything to the local repository.
    upsertOffProduct(offProduct());
    const repository = new LocalFoodRepository([]);
    expect(
      repository.getAll().some((food) => food.id.startsWith("off-")),
    ).toBe(false);
    expect(repository.getByBarcode("4602541000592")).toBeUndefined();
  });

  it("a UserProduct with the same barcode wins over the OFF store (deterministic rule)", () => {
    const userProduct: UserProduct = {
      type: "user",
      id: "user-1",
      name: "Мой творог",
      category: "user",
      aliases: [],
      calories: 120,
      protein: 18,
      fat: 5,
      carbs: 2,
      baseUnit: "g",
      units: [{ key: "g", kind: "g", label: "г", base: 1 }],
      servingOptions: [{ amount: 100, unitKey: "g" }],
      defaultServing: { amount: 100, unitKey: "g" },
      sourceType: "user",
      sourceName: "Пользователь",
      isBranded: false,
      barcode: "4602541000592",
    };
    upsertOffProduct(offProduct());
    const repository = new LocalFoodRepository([userProduct]);
    // Resolution order: local repository first — the user's product wins.
    const resolved = repository.getByBarcode("4602541000592");
    expect(resolved?.type).toBe("user");
    expect(resolved?.name).toBe("Мой творог");
  });
});
