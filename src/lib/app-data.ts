import {
  Bike,
  Coffee,
  Cookie,
  Dumbbell,
  Flame,
  Footprints,
  MoonStar,
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
  { id: "lunch", name: "Обед", icon: Utensils },
  { id: "dinner", name: "Ужин", icon: MoonStar },
  { id: "snacks", name: "Перекусы", icon: Cookie },
];

export function mealName(mealType: MealType): string {
  return MEALS.find((meal) => meal.id === mealType)?.name ?? "";
}

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Мужчина",
  female: "Женщина",
};

/** Default targets until the user changes them in settings. */
export const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2100,
  protein: 140,
  fat: 65,
  carbs: 230,
};

/** Default profile until onboarding/settings provide real values. */
export const DEFAULT_PROFILE: UserProfile = {
  gender: "male",
  age: 28,
  height: 178,
  weight: 76,
  activity: "medium",
  goal: "maintain",
};

export const activityOptions: SelectOption<ActivityLevel>[] = [
  { value: "minimal", label: "Минимальная", description: "Сидячая работа, практически без нагрузок", icon: PersonStanding },
  { value: "low", label: "Низкая", description: "Лёгкие нагрузки 1–3 раза в неделю", icon: Footprints },
  { value: "medium", label: "Средняя", description: "Тренировки 3–5 раз в неделю", icon: Bike },
  { value: "high", label: "Высокая", description: "Интенсивные тренировки 6–7 раз в неделю", icon: Dumbbell },
  { value: "very_high", label: "Очень высокая", description: "Физический труд или две тренировки в день", icon: Flame },
];

export const goalOptions: SelectOption<Goal>[] = [
  { value: "lose", label: "Похудение", description: "Снижение веса за счёт дефицита калорий", icon: TrendingDown },
  { value: "maintain", label: "Поддержание веса", description: "Сохранение текущего веса", icon: Scale },
  { value: "gain", label: "Набор массы", description: "Рост мышечной массы за счёт профицита", icon: TrendingUp },
];
