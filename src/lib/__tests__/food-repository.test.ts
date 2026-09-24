import { beforeEach, describe, expect, it } from "vitest";
import { LocalFoodRepository } from "../food-repository";
import { STORAGE_KEYS, loadUserFoods } from "../storage";
import { getFoodById } from "../food-data";
import type { UserProduct } from "../types";

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

const INPUT = {
  name: "Мой творог",
  calories: 120,
  protein: 18,
  fat: 5,
  carbs: 2,
  baseUnit: "g" as const,
  portionSize: 150,
  isBranded: true,
  brand: "Простоквашино",
  barcode: "46 0010 3101 019",
};

describe("LocalFoodRepository: queries", () => {
  it("getAll returns user products first plus all 273 built-ins", () => {
    const repository = new LocalFoodRepository([]);
    expect(repository.getAll()).toHaveLength(273);
  });

  it("getById resolves a generic food", () => {
    const repository = new LocalFoodRepository([]);
    const egg = repository.getById("egg");
    expect(egg).toBeDefined();
    expect(egg?.type).toBe("generic");
    expect(egg?.name).toBe("Яйцо куриное");
  });

  it("getById resolves a user product and prefers it on id clashes", () => {
    const userProduct = {
      type: "user",
      id: "egg", // collides with the built-in on purpose
      name: "Моё яйцо",
      category: "user",
      aliases: [],
      calories: 100,
      protein: 10,
      fat: 5,
      carbs: 1,
      baseUnit: "g",
      units: [{ key: "g", kind: "g", label: "г", base: 1 }],
      servingOptions: [{ amount: 100, unitKey: "g" }],
      defaultServing: { amount: 100, unitKey: "g" },
      sourceType: "user",
      isBranded: false,
    } as UserProduct;
    const repository = new LocalFoodRepository([userProduct]);
    expect(repository.getById("egg")?.name).toBe("Моё яйцо");
  });

  it("getById returns undefined for unknown ids", () => {
    const repository = new LocalFoodRepository([]);
    expect(repository.getById("does-not-exist")).toBeUndefined();
  });

  it("getByBarcode returns not-found while no products carry barcodes", () => {
    const repository = new LocalFoodRepository([]);
    expect(repository.getByBarcode("4601234567891")).toBeUndefined();
    expect(repository.getByBarcode("not-a-barcode")).toBeUndefined();
  });

  it("getByBarcode finds a user product by normalized barcode", () => {
    const repository = new LocalFoodRepository([]);
    const created = repository.createUserProduct(INPUT);
    // createUserProduct persists; reload user products into a fresh repo.
    const persisted = loadUserFoods();
    const fresh = new LocalFoodRepository(persisted);
    expect(fresh.getByBarcode("4600103101019")).toBeDefined();
    expect(fresh.getByBarcode("46-0010 3101 019")?.id).toBe(created.id);
  });

  it("getByCategory filters by category id", () => {
    const repository = new LocalFoodRepository([]);
    const dairy = repository.getByCategory("dairy");
    expect(dairy.length).toBeGreaterThan(10);
    expect(dairy.every((product) => product.category === "dairy")).toBe(true);
    expect(repository.getByCategory("all")).toHaveLength(273);
  });

  it("search works through the repository", () => {
    const repository = new LocalFoodRepository([]);
    const results = repository.search("греч");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(repository.search("")).toHaveLength(273);
  });
});

describe("LocalFoodRepository: user product CRUD", () => {
  it("createUserProduct builds a user product and persists it", () => {
    const repository = new LocalFoodRepository([]);
    const created = repository.createUserProduct(INPUT);

    expect(created.type).toBe("user");
    expect(created.sourceType).toBe("user");
    expect(created.sourceName).toBe("Пользователь");
    expect(created.id.startsWith("user-")).toBe(true);
    expect(created.brand).toBe("Простоквашино");
    expect(created.barcode).toBe("4600103101019"); // normalized
    expect(created.createdAt).toBeTruthy();

    // The "порция" unit reflects the portion size.
    const serving = created.units.find((unit) => unit.key === "serving");
    expect(serving?.base).toBe(150);
    expect(created.defaultServing).toEqual({ amount: 1, unitKey: "serving" });

    // Persisted to localStorage and re-loadable with full fidelity.
    const persisted = loadUserFoods();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(created.id);
    expect(persisted[0].brand).toBe("Простоквашино");
  });

  it("createUserProduct drops an invalid barcode instead of failing", () => {
    const repository = new LocalFoodRepository([]);
    const created = repository.createUserProduct({
      ...INPUT,
      barcode: "abc-123",
    });
    expect(created.barcode).toBeUndefined();
  });

  it("updateUserProduct applies changes and keeps identity", () => {
    const repository = new LocalFoodRepository([]);
    const created = repository.createUserProduct(INPUT);

    const updated = repository.updateUserProduct(created.id, {
      name: "Творог 9%",
      calories: 150,
    });

    expect(updated?.name).toBe("Творог 9%");
    expect(updated?.calories).toBe(150);
    expect(updated?.id).toBe(created.id);
    expect(updated?.type).toBe("user");
    expect(updated?.brand).toBe("Простоквашино"); // untouched fields survive
    expect(updated?.updatedAt).toBeTruthy();

    const persisted = loadUserFoods();
    expect(persisted[0].name).toBe("Творог 9%");
  });

  it("updateUserProduct returns undefined for unknown ids", () => {
    const repository = new LocalFoodRepository([]);
    expect(repository.updateUserProduct("nope", { name: "X" })).toBeUndefined();
  });

  it("deleteUserProduct removes the product", () => {
    const repository = new LocalFoodRepository([]);
    const created = repository.createUserProduct(INPUT);
    expect(repository.deleteUserProduct(created.id)).toBe(true);
    expect(loadUserFoods()).toHaveLength(0);
    expect(repository.deleteUserProduct(created.id)).toBe(false);
  });

  it("keeps built-in foods intact after user-product operations", () => {
    const repository = new LocalFoodRepository([]);
    repository.createUserProduct(INPUT);
    const fresh = new LocalFoodRepository(loadUserFoods());
    expect(fresh.getById("egg")?.name).toBe("Яйцо куриное");
    expect(getFoodById("buckwheat")?.calories).toBe(330);
    expect(fresh.getAll()).toHaveLength(274);
  });
});

describe("storage keys stay stable", () => {
  it("uses the documented key names", () => {
    expect(STORAGE_KEYS.entries).toBe("nutritrack:v1:entries");
    expect(STORAGE_KEYS.profile).toBe("nutritrack:v1:profile");
    expect(STORAGE_KEYS.targets).toBe("nutritrack:v1:targets");
    expect(STORAGE_KEYS.onboarded).toBe("nutritrack:v1:onboarded");
    expect(STORAGE_KEYS.userFoods).toBe("nutritrack:v1:user-foods");
  });
});
