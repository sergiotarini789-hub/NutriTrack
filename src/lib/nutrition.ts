import { getFoodById } from "./food-data";
import type {
  FoodEntry,
  FoodItem,
  MealType,
  NutritionSummary,
} from "./types";

/** An entry joined with its food from the database. */
export interface ResolvedEntry {
  entry: FoodEntry;
  food: FoodItem;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

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

/** Nutrition of a food scaled to the given amount in grams. */
export function nutritionForAmount(
  food: Pick<FoodItem, "calories" | "protein" | "fat" | "carbs">,
  amount: number,
): NutritionSummary {
  const k = amount / 100;
  return {
    calories: round1(food.calories * k),
    protein: round1(food.protein * k),
    fat: round1(food.fat * k),
    carbs: round1(food.carbs * k),
  };
}

export function sumNutrition(items: NutritionSummary[]): NutritionSummary {
  return items.reduce<NutritionSummary>(
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
export function resolveEntries(entries: FoodEntry[]): ResolvedEntry[] {
  const resolved: ResolvedEntry[] = [];
  for (const entry of entries) {
    const food = getFoodById(entry.foodId);
    if (food) resolved.push({ entry, food });
  }
  return resolved;
}

/** Total nutrition of a list of resolved entries. */
export function nutritionOfEntries(items: ResolvedEntry[]): NutritionSummary {
  return sumNutrition(
    items.map(({ entry, food }) => nutritionForAmount(food, entry.amount)),
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
