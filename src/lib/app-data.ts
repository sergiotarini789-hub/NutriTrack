import {
  Bike,
  Coffee,
  Cookie,
  Dumbbell,
  Flame,
  Footprints,
  Salad,
  PersonStanding,
  Scale,
  TrendingDown,
  TrendingUp,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ActivityLevel,
  Gender,
  Goal,
  MealType,
  NutritionTargets,
  SelectOption,
  UserProfile,
} from "./types";

export interface MealMeta {
  id: MealType;
  name: string;
  icon: LucideIcon;
}

/** Meal types in display order. */
export const MEALS: MealMeta[] = [
  { id: "breakfast", name: "Завтрак", icon: Coffee },
  { id: "lunch", name: "Обед", icon: Salad },
  { id: "dinner", name: "Ужин", icon: Utensils },
  { id: "snacks", name: "Перекусы", icon: Cookie },
];

export function mealName(mealType: MealType): string {
  return MEALS.find((meal) => meal.id === mealType)?.name ?? "";
}

/**
 * Time-based default meal for the add-food flow (the user can always
 * change it on the quantity step).
 */
export function defaultMealForNow(): MealType {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 22) return "dinner";
  return "snacks";
}

/**
 * Foods offered under "Часто используемые" until the diary has enough
 * real history of its own.
 */
export const FREQUENT_FOOD_IDS = [
  "egg",
  "banana",
  "chicken-breast",
  "milk-2.5",
  "white-bread",
  "buckwheat",
] as const;

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Мужской",
  female: "Женский",
};

/**
 * Legacy target fallback (Stage ≤8). Used only when no calculated or
 * manual targets are available — never presented as personalized.
 */
export const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2100,
  protein: 140,
  fat: 65,
  carbs: 230,
};

/**
 * Empty profile: every field unknown. Missing data stays missing — the
 * app never treats placeholder body values as real user data (Stage 9).
 * Onboarding/settings fill these in; goals are calculated only from a
 * complete profile.
 */
export const EMPTY_PROFILE: UserProfile = {
  gender: null,
  age: null,
  height: null,
  weight: null,
  activity: null,
  goal: null,
};

export const activityOptions: SelectOption<ActivityLevel>[] = [
  { value: "minimal", label: "Сидячий образ жизни", description: "Сидячая работа, практически без нагрузок", icon: PersonStanding },
  { value: "low", label: "Лёгкая активность", description: "Лёгкие нагрузки 1–3 раза в неделю", icon: Footprints },
  { value: "medium", label: "Средняя активность", description: "Тренировки 3–5 раз в неделю", icon: Bike },
  { value: "high", label: "Высокая активность", description: "Интенсивные тренировки 6–7 раз в неделю", icon: Dumbbell },
  { value: "very_high", label: "Очень высокая активность", description: "Физический труд или две тренировки в день", icon: Flame },
];

export const goalOptions: SelectOption<Goal>[] = [
  { value: "lose", label: "Похудение", description: "Снижение веса за счёт дефицита калорий", icon: TrendingDown },
  { value: "maintain", label: "Поддержание веса", description: "Сохранение текущего веса", icon: Scale },
  { value: "gain", label: "Набор массы", description: "Рост мышечной массы за счёт профицита", icon: TrendingUp },
];
