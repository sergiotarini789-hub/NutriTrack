import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEYS,
  loadEntries,
  loadUserFoods,
  saveUserFoods,
} from "../storage";
import type { UserProduct } from "../types";

/**
 * Minimal localStorage mock: the storage layer checks for `window`,
 * so the mock is installed as globalThis.window before each test.
 */
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

describe("loadEntries: legacy migration", () => {
  it("migrates entries without a unit to grams", () => {
    storage.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify([
        { id: "old-1", foodId: "buckwheat", mealType: "breakfast", amount: 200, date: "2026-09-17" },
      ]),
    );
    const entries = loadEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].unit).toBe("g");
    expect(entries[0].amount).toBe(200);
  });

  it("keeps valid foodType and createdAt fields", () => {
    storage.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify([
        {
          id: "e1",
          foodId: "user-1",
          foodType: "user",
          mealType: "lunch",
          amount: 1,
          unit: "serving",
          date: "2026-09-17",
          createdAt: "2026-09-17T10:00:00.000Z",
        },
      ]),
    );
    const entries = loadEntries();
    expect(entries[0].foodType).toBe("user");
    expect(entries[0].createdAt).toBe("2026-09-17T10:00:00.000Z");
  });

  it("drops invalid foodType values instead of failing", () => {
    storage.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify([
        {
          id: "e2",
          foodId: "egg",
          foodType: "weird",
          mealType: "breakfast",
          amount: 1,
          unit: "piece",
          date: "2026-09-17",
        },
      ]),
    );
    const entries = loadEntries();
    expect(entries[0].foodType).toBeUndefined();
  });

  it("is idempotent (loading twice gives the same result)", () => {
    storage.setItem(
      STORAGE_KEYS.entries,
      JSON.stringify([
        { id: "old-1", foodId: "rice", mealType: "dinner", amount: 150, date: "2026-09-16" },
      ]),
    );
    expect(loadEntries()).toEqual(loadEntries());
  });

  it("returns an empty list for missing or corrupt data", () => {
    expect(loadEntries()).toEqual([]);
    storage.setItem(STORAGE_KEYS.entries, "not json{{");
    expect(loadEntries()).toEqual([]);
  });
});

describe("loadUserFoods: legacy custom foods", () => {
  it("parses the pre-Stage-6 format and injects the user discriminator", () => {
    // Old shape: no type/brand/barcode/createdAt fields.
    storage.setItem(
      STORAGE_KEYS.userFoods,
      JSON.stringify([
        {
          id: "user-legacy",
          name: "Мой творог",
          category: "user",
          aliases: [],
          calories: 121,
          protein: 17.2,
          fat: 5,
          carbs: 1.8,
          baseUnit: "g",
          units: [{ key: "g", kind: "g", label: "г", base: 1 }],
          servingOptions: [{ amount: 100, unitKey: "g" }],
          defaultServing: { amount: 100, unitKey: "g" },
          sourceType: "user",
          sourceName: "Пользователь",
          isBranded: true,
        },
      ]),
    );
    const products = loadUserFoods();
    expect(products).toHaveLength(1);
    const product = products[0];
    expect(product.type).toBe("user");
    expect(product.sourceType).toBe("user");
    expect(product.name).toBe("Мой творог");
    expect(product.calories).toBe(121);
    // No data loss: the isBranded flag from the old record survives.
    expect(product.isBranded).toBe(true);
  });

  it("preserves brand, barcode (normalized) and timestamps", () => {
    storage.setItem(
      STORAGE_KEYS.userFoods,
      JSON.stringify([
        {
          id: "user-2",
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
          type: "user",
          brand: "Снежный",
          barcode: "46 0010 3101",
          createdAt: "2026-09-01T00:00:00.000Z",
        },
      ]),
    );
    const products = loadUserFoods();
    expect(products[0].brand).toBe("Снежный");
    expect(products[0].barcode).toBe("4600103101");
    expect(products[0].createdAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("normalizes an invalid barcode to undefined without losing the product", () => {
    storage.setItem(
      STORAGE_KEYS.userFoods,
      JSON.stringify([
        {
          id: "user-3",
          name: "Суп",
          category: "user",
          aliases: [],
          calories: 50,
          protein: 3,
          fat: 2,
          carbs: 4,
          baseUnit: "g",
          units: [{ key: "g", kind: "g", label: "г", base: 1 }],
          servingOptions: [{ amount: 100, unitKey: "g" }],
          defaultServing: { amount: 100, unitKey: "g" },
          sourceType: "user",
          isBranded: false,
          barcode: "abc-not-a-barcode",
        },
      ]),
    );
    const products = loadUserFoods();
    expect(products).toHaveLength(1);
    expect(products[0].barcode).toBeUndefined();
  });

  it("round-trips without data loss and is idempotent", () => {
    const original: UserProduct = {
      type: "user",
      id: "user-rt",
      name: "Каша",
      category: "user",
      aliases: ["кашка"],
      calories: 100,
      protein: 4,
      fat: 2,
      carbs: 16,
      baseUnit: "g",
      units: [
        { key: "serving", kind: "serving", label: "порция", few: "порции", many: "порций", base: 250 },
        { key: "g", kind: "g", label: "г", base: 1 },
      ],
      servingOptions: [{ amount: 1, unitKey: "serving" }],
      defaultServing: { amount: 1, unitKey: "serving" },
      sourceType: "user",
      sourceName: "Пользователь",
      isBranded: false,
      brand: "Домашняя",
      barcode: "1234567890123",
      createdAt: "2026-09-02T00:00:00.000Z",
      updatedAt: "2026-09-03T00:00:00.000Z",
    };
    saveUserFoods([original]);
    const first = loadUserFoods();
    const second = loadUserFoods();
    expect(first).toEqual([original]);
    expect(second).toEqual(first);
  });

  it("tolerates corrupt and missing data", () => {
    expect(loadUserFoods()).toEqual([]);
    storage.setItem(STORAGE_KEYS.userFoods, "[{bad json");
    expect(loadUserFoods()).toEqual([]);
  });
});
