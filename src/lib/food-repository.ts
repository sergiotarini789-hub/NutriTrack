import { normalizeBarcode } from "./barcode";
import {
  ALL_CATEGORY,
  G_UNIT,
  ML_UNIT,
  searchFoods,
  foods as builtInFoods,
} from "./food-data";
import { loadUserFoods, saveUserFoods } from "./storage";
import type {
  FoodCategoryId,
  FoodProduct,
  FoodRepository,
  FoodServing,
  FoodUnit,
  UserProduct,
  UserProductInput,
  UserProductUpdate,
} from "./types";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "порция" unit added to user products with a portion size. */
function servingUnit(base: number): FoodUnit {
  return {
    key: "serving",
    kind: "serving",
    label: "порция",
    few: "порции",
    many: "порций",
    base,
  };
}

function baseServings(baseUnit: "g" | "ml"): FoodServing[] {
  return baseUnit === "ml"
    ? [
        { amount: 100, unitKey: "ml" },
        { amount: 200, unitKey: "ml" },
        { amount: 250, unitKey: "ml" },
      ]
    : [
        { amount: 50, unitKey: "g" },
        { amount: 100, unitKey: "g" },
        { amount: 150, unitKey: "g" },
      ];
}

/** Builds a UserProduct from the form input (no storage involved). */
function buildUserProduct(input: UserProductInput): UserProduct {
  const baseUnitKey = input.baseUnit;
  const hasPortion =
    typeof input.portionSize === "number" && input.portionSize > 0;
  const now = new Date().toISOString();

  return {
    type: "user",
    id: createId("user"),
    name: input.name.trim(),
    category: "user",
    aliases: [],
    calories: input.calories,
    protein: input.protein,
    fat: input.fat,
    carbs: input.carbs,
    baseUnit: baseUnitKey,
    units: hasPortion
      ? [servingUnit(input.portionSize as number), baseUnitKey === "ml" ? ML_UNIT : G_UNIT]
      : [baseUnitKey === "ml" ? ML_UNIT : G_UNIT],
    servingOptions: hasPortion
      ? [
          { amount: 1, unitKey: "serving" },
          { amount: 100, unitKey: baseUnitKey },
        ]
      : baseServings(baseUnitKey),
    defaultServing: hasPortion
      ? { amount: 1, unitKey: "serving" }
      : { amount: 100, unitKey: baseUnitKey },
    sourceType: "user",
    sourceName: "Пользователь",
    isBranded: input.isBranded === true,
    brand: input.brand?.trim() || undefined,
    barcode: normalizeBarcode(input.barcode),
    ingredients: input.ingredients?.trim() || undefined,
    packageSize:
      typeof input.packageSize === "number" && input.packageSize > 0
        ? input.packageSize
        : undefined,
    packageUnit: input.packageUnit?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Local food repository: the built-in generic foods plus the user's
 * own products. Queries are pure reads over the collections given at
 * construction (the React state snapshot); the user-product CRUD
 * reads and writes localStorage — the single source of truth — so it
 * stays correct regardless of when the instance was created. Remote
 * repositories (Open Food Facts, FatSecret) can implement the same
 * FoodRepository interface later without UI changes.
 */
export class LocalFoodRepository implements FoodRepository {
  private readonly userProducts: UserProduct[];
  private readonly index: Map<string, FoodProduct>;

  constructor(userProducts: UserProduct[] = []) {
    this.userProducts = userProducts;
    this.index = new Map<string, FoodProduct>();
    // Built-ins are indexed first so user products take precedence
    // over built-ins with the same id.
    for (const product of [...builtInFoods, ...userProducts]) {
      this.index.set(product.id, product);
    }
  }

  getAll(): FoodProduct[] {
    return [...this.userProducts, ...builtInFoods];
  }

  getById(id: string): FoodProduct | undefined {
    return this.index.get(id);
  }

  getByBarcode(barcode: string): FoodProduct | undefined {
    const normalized = normalizeBarcode(barcode);
    if (!normalized) return undefined;
    return this.getAll().find((product) => product.barcode === normalized);
  }

  getByCategory(categoryId: string): FoodProduct[] {
    if (categoryId === ALL_CATEGORY) return this.getAll();
    return this.getAll().filter(
      (product) => product.category === (categoryId as FoodCategoryId),
    );
  }

  search(query: string, categoryId: string = ALL_CATEGORY): FoodProduct[] {
    return searchFoods(this.getAll(), query, categoryId);
  }

  createUserProduct(input: UserProductInput): UserProduct {
    const product = buildUserProduct(input);
    saveUserFoods([product, ...loadUserFoods()]);
    return product;
  }

  updateUserProduct(
    id: string,
    changes: UserProductUpdate,
  ): UserProduct | undefined {
    const collection = loadUserFoods();
    const existing = collection.find((product) => product.id === id);
    if (!existing) return undefined;
    const next: UserProduct = {
      ...existing,
      ...changes,
      // Identity and discriminator never change.
      id: existing.id,
      type: "user",
      sourceType: "user",
      name: (changes.name ?? existing.name).trim(),
      brand: (changes.brand ?? existing.brand ?? "")?.trim() || undefined,
      barcode: normalizeBarcode(changes.barcode ?? existing.barcode),
      updatedAt: new Date().toISOString(),
    };
    saveUserFoods(
      collection.map((product) => (product.id === id ? next : product)),
    );
    return next;
  }

  deleteUserProduct(id: string): boolean {
    const collection = loadUserFoods();
    const exists = collection.some((product) => product.id === id);
    if (!exists) return false;
    saveUserFoods(collection.filter((product) => product.id !== id));
    return true;
  }
}
