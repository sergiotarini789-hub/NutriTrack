import type { LucideIcon } from "lucide-react";

export type Gender = "male" | "female";

export type ActivityLevel =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type Goal = "lose" | "maintain" | "gain";

/** Nutrition values for a day: calories in kcal, macros in grams. */
export interface NutritionSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  icon: LucideIcon;
}

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

export interface HistoryDay {
  id: string;
  /** e.g. "15 сентября" */
  dateLabel: string;
  /** e.g. "вторник" */
  weekdayLabel: string;
  /** short weekday label for charts, e.g. "Вт" */
  shortWeekday: string;
  calories: number;
  isToday: boolean;
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
}
