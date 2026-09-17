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

/** Food item with nutrition values per 100 g. */
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  icon: LucideIcon;
}

/** A food added to a meal on a specific day. */
export interface FoodEntry {
  id: string;
  foodId: string;
  mealType: MealType;
  /** Amount in grams. */
  amount: number;
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
