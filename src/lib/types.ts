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

/** Nutrition values: calories in kcal, macros in grams. */
export interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

/** Daily nutrition targets. */
export type NutritionTargets = NutritionSummary;

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

/** Where the nutrition data comes from. */
export type SourceType = "generic" | "manufacturer" | "database" | "user";

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

/** Food item with nutrition values per 100 g or per 100 ml. */
export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategoryId;
  /** Alternative search terms. */
  aliases: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  baseUnit: BaseUnit;
  /** Units selectable for this food; the base unit is always included. */
  units: FoodUnit[];
  servingOptions: FoodServing[];
  defaultServing: FoodServing;
  sourceType: SourceType;
  sourceName?: string;
  isBranded: boolean;
}

/** A food added to a meal on a specific day. */
export interface FoodEntry {
  id: string;
  foodId: string;
  mealType: MealType;
  /** Amount in the selected unit (see `unit`). */
  amount: number;
  /** Unit key from FoodItem.units, e.g. "g", "piece". Legacy: "g". */
  unit: string;
  /** Local date key in "YYYY-MM-DD" format. */
  date: string;
}

export interface UserProfile {
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
