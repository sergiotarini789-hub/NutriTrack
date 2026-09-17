import type { LucideIcon } from "lucide-react";

export type Gender = "male" | "female";

export type ActivityLevel =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type Goal = "lose" | "maintain" | "gain";

export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

/**
 * Reusable nutrition values: calories in kcal, macros in grams.
 * Used for per-100 reference values, computed portions and daily totals.
 */
export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

/** Legacy name kept for existing code; identical to NutritionInfo. */
export type NutritionSummary = NutritionInfo;

/** Daily nutrition targets. */
export type NutritionTargets = NutritionInfo;

/* ------------------------------------------------------------------ */
/* Food database                                                       */
/* ------------------------------------------------------------------ */

/** Base unit nutrition values are expressed per 100 of. */
export type BaseUnit = "g" | "ml";

/** Semantic kinds of serving units. */
export type ServingUnitKind =
  | "g"
  | "ml"
  | "piece"
  | "slice"
  | "serving"
  | "package";

/**
 * Where the nutrition data comes from. "open_food_facts" and
 * "fatsecret" are reserved for future external integrations — no
 * integration exists yet.
 */
export type FoodSourceType =
  | "generic"
  | "user"
  | "open_food_facts"
  | "fatsecret"
  | "database"
  | "manufacturer";

/**
 * Structured view of a product's data source. Built from the flat
 * source fields via `sourceOf()`; external repositories will fill in
 * externalId/barcode/verified.
 */
export interface FoodSource {
  type: FoodSourceType;
  name?: string;
  externalId?: string;
  barcode?: string;
  verified?: boolean;
}

/** Discriminator for the food product union. */
export type FoodProductType = "generic" | "branded" | "user";

export type FoodCategoryId =
  | "cereals"
  | "pasta"
  | "meat"
  | "poultry"
  | "fish"
  | "eggs"
  | "dairy"
  | "vegetables"
  | "fruits"
  | "berries"
  | "bakery"
  | "nuts"
  | "legumes"
  | "oils"
  | "drinks"
  | "sweets"
  | "ready"
  | "user";

/**
 * A unit the food can be measured in. `base` is the amount of the food's
 * base unit (g or ml) that one unit corresponds to, e.g. 1 шт ≈ 50 г.
 */
export interface FoodUnit {
  /** Stable key stored in diary entries, e.g. "g", "ml", "piece", "tsp". */
  key: string;
  kind: ServingUnitKind;
  /** Short Russian label in singular, e.g. "г", "шт", "ломтик", "ч. л.". */
  label: string;
  /** Genitive singular for fractional amounts, e.g. "ломтика". */
  few?: string;
  /** Genitive plural, e.g. "ломтиков". */
  many?: string;
  /** Amount in base units (g for g-foods, ml for ml-foods) per 1 unit. */
  base: number;
}

/** A quick-pick serving, e.g. "1 шт" or "250 мл". */
export interface FoodServing {
  amount: number;
  unitKey: string;
}

/**
 * Conceptual serving model: a named portion with its equivalent in
 * grams or milliliters. Projected from FoodServing/FoodUnit via
 * `servingsOf()`; future external products may carry their own.
 */
export interface Serving {
  id?: string;
  /** Display label, e.g. "1 шт", "250 мл", "1 ст. л.". */
  name: string;
  amount: number;
  /** Unit key, e.g. "g", "ml", "piece", "tsp". */
  unit: string;
  gramsEquivalent?: number;
  millilitersEquivalent?: number;
}

/**
 * Common runtime shape shared by every food product. Per-100 nutrition
 * values are stored flat (persisted form); use `nutritionOf(food)` and
 * `sourceOf(food)` for the structured NutritionInfo/FoodSource views.
 */
export interface FoodProductBase {
  /** Discriminator: "generic" | "branded" | "user". */
  type: FoodProductType;
  id: string;
  name: string;
  category: FoodCategoryId;
  /** Alternative search terms. */
  aliases: string[];
  /** Calories per 100 g / 100 ml. */
  calories: number;
  /** Protein (g) per 100 g / 100 ml. */
  protein: number;
  /** Fat (g) per 100 g / 100 ml. */
  fat: number;
  /** Carbs (g) per 100 g / 100 ml. */
  carbs: number;
  baseUnit: BaseUnit;
  /** Units selectable for this food; the base unit is always included. */
  units: FoodUnit[];
  servingOptions: FoodServing[];
  defaultServing: FoodServing;
  /** Source metadata (flat persisted form; see sourceOf()). */
  sourceType: FoodSourceType;
  sourceName?: string;
  /** Stable id in the external source, e.g. an Open Food Facts id. */
  sourceId?: string;
  isBranded: boolean;
  /** Brand name; only set for real branded products. */
  brand?: string;
  /** Manufacturer; only set when actually known. */
  manufacturer?: string;
  /** EAN/UPC barcode; normalized digits only (see normalizeBarcode). */
  barcode?: string;
  /** Ingredient list, when known. */
  ingredients?: string;
  /** Package size with packageUnit, e.g. 330 + "мл". */
  packageSize?: number;
  packageUnit?: string;
  /** Product photo, when available from a real source. */
  imageUrl?: string;
  /** Whether the source data has been verified. */
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * A generic reference food (e.g. "Куриная грудка", "Рис (сухой)") —
 * never a specific manufacturer's product. All 273 built-in foods
 * are GenericFoods.
 */
export interface GenericFood extends FoodProductBase {
  type: "generic";
  sourceType: "generic";
  isBranded: false;
}

/**
 * A real commercial product by a specific manufacturer. Reserved for
 * external food databases (Open Food Facts, FatSecret) — no branded
 * products exist in the local database yet, and none may be invented.
 */
export interface BrandedProduct extends FoodProductBase {
  type: "branded";
  sourceType: "open_food_facts" | "fatsecret" | "database" | "manufacturer";
  isBranded: true;
}

/**
 * A product manually created by the user (typically from a nutrition
 * label). Continues the former "custom food" concept.
 */
export interface UserProduct extends FoodProductBase {
  type: "user";
  sourceType: "user";
  isBranded: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Any food/product the application can display or log. */
export type FoodProduct = GenericFood | BrandedProduct | UserProduct;

/**
 * Legacy alias kept so existing components keep compiling; new code
 * should prefer FoodProduct (or the specific variants).
 */
export type FoodItem = FoodProduct;

/** A food added to a meal on a specific day. */
export interface FoodEntry {
  id: string;
  /** References a FoodProduct id (built-in, user-created or external). */
  foodId: string;
  /**
   * Which kind of product the entry references. Optional for backward
   * compatibility with entries saved before this field existed;
   * resolution never depends on it alone.
   */
  foodType?: FoodProductType;
  mealType: MealType;
  /** Amount in the selected unit (see `unit`). */
  amount: number;
  /** Unit key from the product's units, e.g. "g", "piece". Legacy: "g". */
  unit: string;
  /** Local date key in "YYYY-MM-DD" format. */
  date: string;
  /** ISO timestamp of when the entry was created (newer entries). */
  createdAt?: string;
}

export interface UserProfile {
  /** Optional display name from onboarding; used for greetings. */
  name?: string;
  gender: Gender | null;
  /** Years. */
  age: number | null;
  /** Centimeters. */
  height: number | null;
  /** Kilograms. */
  weight: number | null;
  activity: ActivityLevel | null;
  goal: Goal | null;
}

/** View-model for the history screens. */
export interface HistoryDayInfo {
  dateKey: string;
  /** e.g. "15 сентября" */
  label: string;
  /** e.g. "вторник" */
  weekdayLabel: string;
  /** e.g. "Вт" */
  shortWeekday: string;
  /** Total calories for the day, or null when there are no entries. */
  calories: number | null;
  /** Macro totals for the day (null when there are no entries). */
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  isToday: boolean;
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface FoodCategory {
  id: FoodCategoryId;
  name: string;
  icon: LucideIcon;
}

/* ------------------------------------------------------------------ */
/* Food repository                                                     */
/* ------------------------------------------------------------------ */

/** Data needed to create a user product. */
export interface UserProductInput {
  name: string;
  /** Per 100 g / 100 ml values. */
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  baseUnit: BaseUnit;
  /** Optional portion size in base units; adds a "порция" unit. */
  portionSize?: number | null;
  isBranded?: boolean;
  brand?: string;
  /** Raw barcode; normalized before storing (see normalizeBarcode). */
  barcode?: string;
  ingredients?: string;
  packageSize?: number;
  packageUnit?: string;
}

/** A change to an existing user product. */
export type UserProductUpdate = Partial<UserProductInput>;

/**
 * Read/write abstraction over the food data. The UI depends on this
 * interface, not on a hardcoded array — a future OpenFoodFacts- or
 * FatSecret-backed repository can be swapped in without UI changes.
 */
export interface FoodRepository {
  /** All products available locally (user products first). */
  getAll(): FoodProduct[];
  getById(id: string): FoodProduct | undefined;
  /** Local products only; external repositories may add remote lookup. */
  getByBarcode(barcode: string): FoodProduct | undefined;
  getByCategory(categoryId: string): FoodProduct[];
  /** Local search by name, brand, aliases and category name. */
  search(query: string, categoryId?: string): FoodProduct[];
  createUserProduct(input: UserProductInput): UserProduct;
  updateUserProduct(id: string, changes: UserProductUpdate): UserProduct | undefined;
  deleteUserProduct(id: string): boolean;
}
