import type {
  FoodEntry,
  FoodProduct,
  FoodServing,
  FoodSource,
  FoodUnit,
  MealType,
  NutritionInfo,
  Serving,
} from "./types";
import { formatNumber, pluralize } from "./format";

/** An entry joined with its food from the database. */
export interface ResolvedEntry {
  entry: FoodEntry;
  food: FoodProduct;
}

/** Looks up any food product (built-in, user-created or external) by id. */
export type FoodLookup = (id: string) => FoodProduct | undefined;

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Parses a user-entered number, supporting "," as a decimal separator.
 * Returns null for empty or non-numeric input.
 */
export function parseAmountInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

/** Russian label for the food's base unit: "г" or "мл". */
export function baseUnitLabel(food: { baseUnit: "g" | "ml" }): string {
  return food.baseUnit === "ml" ? "мл" : "г";
}

/** Per-100 nutrition values of a product as a structured NutritionInfo. */
export function nutritionOf(
  food: Pick<FoodProduct, "calories" | "protein" | "fat" | "carbs">,
): NutritionInfo {
  return {
    calories: food.calories,
    protein: food.protein,
    fat: food.fat,
    carbs: food.carbs,
  };
}

/** Source metadata of a product as a structured FoodSource. */
export function sourceOf(food: FoodProduct): FoodSource {
  return {
    type: food.sourceType,
    name: food.sourceName,
    externalId: food.sourceId,
    barcode: food.barcode,
    verified: food.verified,
  };
}

/** Discriminator of a product, with a safe fallback for old data. */
export function foodTypeOf(food: FoodProduct): FoodProduct["type"] {
  const { type, sourceType, isBranded } = food;
  if (type) return type;
  return sourceType === "user" ? "user" : isBranded ? "branded" : "generic";
}

/**
 * Human-readable Russian source label, e.g. "Справочные данные",
 * "Пользователь", "Open Food Facts" (future external sources).
 */
export function sourceLabelOf(food: FoodProduct): string {
  switch (food.sourceType) {
    case "user":
      return "Пользователь";
    case "open_food_facts":
      return food.sourceName ?? "Open Food Facts";
    case "fatsecret":
      return food.sourceName ?? "FatSecret";
    case "manufacturer":
      return food.sourceName ?? "Производитель";
    case "database":
      return food.sourceName ?? "База данных";
    default:
      return "Справочные данные";
  }
}

/**
 * Projects the product's quick servings into the conceptual Serving
 * model (label + gram/milliliter equivalents).
 */
export function servingsOf(food: FoodProduct): Serving[] {
  return food.servingOptions.map((serving, index) => {
    const unit = getFoodUnit(food, serving.unitKey);
    const equivalent = round2(serving.amount * unit.base);
    return {
      id: `${food.id}:${serving.unitKey}:${serving.amount}:${index}`,
      name: formatServing(food, serving),
      amount: serving.amount,
      unit: serving.unitKey,
      ...(food.baseUnit === "ml"
        ? { millilitersEquivalent: equivalent }
        : { gramsEquivalent: equivalent }),
    };
  });
}

/** Finds a unit definition by key; falls back to the base unit. */
export function getFoodUnit(food: FoodProduct, unitKey: string): FoodUnit {
  const found = food.units.find((candidate) => candidate.key === unitKey);
  if (found) return found;
  return food.units.find((candidate) => candidate.key === food.baseUnit) ??
    food.units[food.units.length - 1];
}

/** Converts an amount in the given unit to the food's base unit (g or ml). */
export function toBaseAmount(
  food: FoodProduct,
  amount: number,
  unitKey: string,
): number {
  const unit = food.units.find((candidate) => candidate.key === unitKey);
  if (!unit) return amount;
  return round2(amount * unit.base);
}

/** Unit label declined for the amount, e.g. "ломтик" / "ломтика" / "ломтиков". */
export function unitLabelFor(unit: FoodUnit, amount: number): string {
  if (amount === 1) return unit.label;
  if (!Number.isInteger(amount)) return unit.few ?? unit.label;
  if (!unit.few || !unit.many) return unit.label;
  return pluralize(amount, unit.label, unit.few, unit.many);
}

/** e.g. "2 шт", "0,5 ломтика", "150 г". */
export function formatAmountInUnit(
  food: FoodProduct,
  amount: number,
  unitKey: string,
): string {
  const unit = getFoodUnit(food, unitKey);
  return `${formatNumber(amount)} ${unitLabelFor(unit, amount)}`;
}

/**
 * Full entry amount with a base-unit equivalent for non-base units,
 * e.g. "2 шт · 100 г" (или "2 шт" в кратком виде).
 */
export function formatEntryAmount(
  food: FoodProduct,
  amount: number,
  unitKey: string,
  options: { withBase?: boolean } = {},
): string {
  const { withBase = true } = options;
  const base = formatAmountInUnit(food, amount, unitKey);
  if (!withBase || unitKey === food.baseUnit) return base;
  const baseAmount = toBaseAmount(food, amount, unitKey);
  const baseLabel = food.baseUnit === "ml" ? "мл" : "г";
  return `${base} · ${formatNumber(baseAmount)} ${baseLabel}`;
}

/** Quick serving label, e.g. "1 шт", "0,5 шт", "250 мл". */
export function formatServing(food: FoodProduct, serving: FoodServing): string {
  return formatAmountInUnit(food, serving.amount, serving.unitKey);
}

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

/** Nutrition of a food scaled to the given amount in base units (g/ml). */
export function nutritionForBaseAmount(
  food: Pick<FoodProduct, "calories" | "protein" | "fat" | "carbs">,
  baseAmount: number,
): NutritionInfo {
  const k = baseAmount / 100;
  return {
    calories: round1(food.calories * k),
    protein: round1(food.protein * k),
    fat: round1(food.fat * k),
    carbs: round1(food.carbs * k),
  };
}

/** Nutrition of the given amount of food in the given unit. */
export function nutritionForServing(
  food: FoodProduct,
  amount: number,
  unitKey: string,
): NutritionInfo {
  return nutritionForBaseAmount(food, toBaseAmount(food, amount, unitKey));
}

export function sumNutrition(items: NutritionInfo[]): NutritionInfo {
  return items.reduce<NutritionInfo>(
    (acc, item) => ({
      calories: round1(acc.calories + item.calories),
      protein: round1(acc.protein + item.protein),
      fat: round1(acc.fat + item.fat),
      carbs: round1(acc.carbs + item.carbs),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

/** Joins entries with foods from the database, skipping unknown food ids. */
export function resolveEntries(
  entries: FoodEntry[],
  lookup: FoodLookup,
): ResolvedEntry[] {
  const resolved: ResolvedEntry[] = [];
  for (const entry of entries) {
    const food = lookup(entry.foodId);
    if (food) resolved.push({ entry, food });
  }
  return resolved;
}

/**
 * Resolves a single diary entry to its food via the lookup. Works the
 * same for generic, branded and user products — the UI never needs to
 * know where the food came from.
 */
export function resolveFoodEntry(
  entry: FoodEntry,
  lookup: FoodLookup,
): ResolvedEntry | undefined {
  const food = lookup(entry.foodId);
  return food ? { entry, food } : undefined;
}

/** Total nutrition of a list of resolved entries. */
export function nutritionOfEntries(
  items: ResolvedEntry[],
): NutritionInfo {
  return sumNutrition(
    items.map(({ entry, food }) =>
      nutritionForServing(food, entry.amount, entry.unit),
    ),
  );
}

export function entriesForDate(
  entries: FoodEntry[],
  date: string,
): FoodEntry[] {
  return entries.filter((entry) => entry.date === date);
}

export function entriesForMeal(
  entries: FoodEntry[],
  date: string,
  mealType: MealType,
): FoodEntry[] {
  return entries.filter(
    (entry) => entry.date === date && entry.mealType === mealType,
  );
}

/* ------------------------------------------------------------------ */
/* Unit conversion for the editor                                      */
/* ------------------------------------------------------------------ */

/**
 * Converts an amount from one unit to another keeping the same nutrition.
 * Used when the user switches the unit in the editor.
 */
export function convertAmount(
  food: FoodProduct,
  amount: number,
  fromUnitKey: string,
  toUnitKey: string,
): number {
  if (fromUnitKey === toUnitKey) return amount;
  const from = food.units.find((candidate) => candidate.key === fromUnitKey);
  const to = food.units.find((candidate) => candidate.key === toUnitKey);
  if (!from || !to) return amount;
  const converted = (amount * from.base) / to.base;
  // Keep the number friendly: integers stay integers, else 2 decimals.
  return converted >= 10 ? Math.round(converted) : round2(converted);
}

/** Stepper step for a unit kind. */
export function stepForUnit(unitKey: string, food: FoodProduct): number {
  const unit = getFoodUnit(food, unitKey);
  return unit.kind === "g" || unit.kind === "ml" ? 10 : 1;
}

/** Minimum sensible amount for a unit kind. */
export function minForUnit(unitKey: string, food: FoodProduct): number {
  const unit = getFoodUnit(food, unitKey);
  return unit.kind === "g" || unit.kind === "ml" ? 1 : 0.5;
}
