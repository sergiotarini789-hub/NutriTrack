import {
  Banana,
  Bike,
  Coffee,
  Cookie,
  Drumstick,
  Dumbbell,
  Egg,
  Fish,
  Flame,
  Footprints,
  Milk,
  MoonStar,
  PersonStanding,
  Scale,
  Soup,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wheat,
} from "lucide-react";
import type {
  ActivityLevel,
  FoodItem,
  Goal,
  HistoryDay,
  Meal,
  NutritionSummary,
  SelectOption,
} from "./types";

/* ------------------------------------------------------------------ */
/* Today (dashboard)                                                   */
/* ------------------------------------------------------------------ */

export const todayFullLabel = "17 сентября, четверг";

export const dailyTargets: NutritionSummary = {
  calories: 2100,
  protein: 140,
  fat: 65,
  carbs: 230,
};

export const todayConsumed: NutritionSummary = {
  calories: 1540,
  protein: 96,
  fat: 48,
  carbs: 170,
};

export const meals: Meal[] = [
  {
    id: "breakfast",
    name: "Завтрак",
    description: "Овсянка, банан и яйцо",
    calories: 420,
    icon: Coffee,
  },
  {
    id: "lunch",
    name: "Обед",
    description: "Гречка с куриной грудкой",
    calories: 620,
    icon: Utensils,
  },
  {
    id: "dinner",
    name: "Ужин",
    description: "Рис с тунцом",
    calories: 500,
    icon: MoonStar,
  },
  {
    id: "snacks",
    name: "Перекусы",
    description: "Ничего не добавлено",
    calories: 0,
    icon: Cookie,
  },
];

/* ------------------------------------------------------------------ */
/* Food database (per 100 g)                                           */
/* ------------------------------------------------------------------ */

export const foods: FoodItem[] = [
  { id: "buckwheat", name: "Гречка", calories: 330, protein: 12.6, fat: 3.3, carbs: 62.1, icon: Wheat },
  { id: "rice", name: "Рис", calories: 344, protein: 6.7, fat: 0.7, carbs: 78.9, icon: Wheat },
  { id: "chicken-breast", name: "Куриная грудка", calories: 113, protein: 23.6, fat: 1.9, carbs: 0.4, icon: Drumstick },
  { id: "egg", name: "Яйцо", calories: 157, protein: 12.7, fat: 11.5, carbs: 0.7, icon: Egg },
  { id: "tuna", name: "Тунец", calories: 108, protein: 23.0, fat: 1.0, carbs: 0.0, icon: Fish },
  { id: "cottage-cheese", name: "Творог", calories: 121, protein: 17.2, fat: 5.0, carbs: 1.8, icon: Milk },
  { id: "oatmeal", name: "Овсянка", calories: 352, protein: 12.3, fat: 6.2, carbs: 61.8, icon: Soup },
  { id: "pasta", name: "Макароны", calories: 350, protein: 11.8, fat: 1.3, carbs: 73.3, icon: Wheat },
  { id: "mackerel", name: "Скумбрия", calories: 191, protein: 18.0, fat: 13.2, carbs: 0.0, icon: Fish },
  { id: "banana", name: "Банан", calories: 89, protein: 1.5, fat: 0.2, carbs: 21.5, icon: Banana },
];

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

export const historyDays: HistoryDay[] = [
  { id: "09-11", dateLabel: "11 сентября", weekdayLabel: "пятница", shortWeekday: "Пт", calories: 1860, isToday: false },
  { id: "09-12", dateLabel: "12 сентября", weekdayLabel: "суббота", shortWeekday: "Сб", calories: 2050, isToday: false },
  { id: "09-13", dateLabel: "13 сентября", weekdayLabel: "воскресенье", shortWeekday: "Вс", calories: 1740, isToday: false },
  { id: "09-14", dateLabel: "14 сентября", weekdayLabel: "понедельник", shortWeekday: "Пн", calories: 1920, isToday: false },
  { id: "09-15", dateLabel: "15 сентября", weekdayLabel: "вторник", shortWeekday: "Вт", calories: 1980, isToday: false },
  { id: "09-16", dateLabel: "16 сентября", weekdayLabel: "среда", shortWeekday: "Ср", calories: 2140, isToday: false },
  { id: "09-17", dateLabel: "17 сентября", weekdayLabel: "четверг", shortWeekday: "Чт", calories: 1540, isToday: true },
];

/* ------------------------------------------------------------------ */
/* Profile (settings)                                                  */
/* ------------------------------------------------------------------ */

export const profileSettings = {
  age: "28 лет",
  height: "178 см",
  weight: "76 кг",
  gender: "Мужчина",
  activity: "Средняя",
  goal: "Поддержание веса",
};

/* ------------------------------------------------------------------ */
/* Onboarding options                                                  */
/* ------------------------------------------------------------------ */

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
