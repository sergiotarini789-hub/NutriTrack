import { DEFAULT_PROFILE, DEFAULT_TARGETS } from "./app-data";
import { G_UNIT, ML_UNIT } from "./food-data";
import type {
  ActivityLevel,
  BaseUnit,
  FoodCategoryId,
  FoodEntry,
  FoodItem,
  FoodServing,
  FoodUnit,
  Gender,
  Goal,
  MealType,
  NutritionTargets,
  SourceType,
  UserProfile,
} from "./types";

/**
 * Local persistence layer on top of localStorage.
 * All app data lives under the "nutritrack:v1" prefix.
 */
const PREFIX = "nutritrack:v1";

export const STORAGE_KEYS = {
  entries: `${PREFIX}:entries`,
  profile: `${PREFIX}:profile`,
  targets: `${PREFIX}:targets`,
  units: `${PREFIX}:units`,
  onboarded: `${PREFIX}:onboarded`,
  userFoods: `${PREFIX}:user-foods`,
} as const;

export type Units = "metric" | "imperial";

const MEAL_TYPES: readonly MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
];

const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "very_high",
];

const GOALS: readonly Goal[] = ["lose", "maintain", "gain"];

const BASE_UNITS: readonly BaseUnit[] = ["g", "ml"];

const SOURCE_TYPES: readonly SourceType[] = [
  "generic",
  "manufacturer",
  "database",
  "user",
];

const USER_CATEGORY_IDS: readonly FoodCategoryId[] = [
  "user",
  "cereals",
  "pasta",
  "meat",
  "poultry",
  "fish",
  "eggs",
  "dairy",
  "vegetables",
  "fruits",
  "berries",
  "bakery",
  "nuts",
  "legumes",
  "oils",
  "drinks",
  "sweets",
  "ready",
];

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage unavailable — ignore
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

/* ------------------------------ Entries ------------------------------ */

function isValidEntry(value: unknown): value is FoodEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.foodId === "string" &&
    typeof value.mealType === "string" &&
    MEAL_TYPES.includes(value.mealType as MealType) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    value.amount <= 1_000_000 &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date)
  );
}

/**
 * Loads diary entries. Entries saved before serving units existed have no
 * `unit` field — they are migrated to `unit: "g"` (amounts were grams).
 */
export function loadEntries(): FoodEntry[] {
  const raw = readJson<unknown>(STORAGE_KEYS.entries);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidEntry).map((entry) => ({
    ...entry,
    unit: typeof entry.unit === "string" && entry.unit ? entry.unit : "g",
  }));
}

export function saveEntries(entries: FoodEntry[]): void {
  writeJson(STORAGE_KEYS.entries, entries);
}

/* ----------------------------- User foods ---------------------------- */

function parseUnit(value: unknown): FoodUnit | null {
  if (!isRecord(value)) return null;
  if (typeof value.key !== "string" || !value.key) return null;
  if (typeof value.label !== "string" || !value.label) return null;
  const base = positiveNumber(value.base);
  if (base === null) return null;
  return {
    key: value.key,
    kind:
      typeof value.kind === "string" && value.kind
        ? (value.kind as FoodUnit["kind"])
        : "serving",
    label: value.label,
    few: typeof value.few === "string" ? value.few : undefined,
    many: typeof value.many === "string" ? value.many : undefined,
    base,
  };
}

function parseServing(value: unknown): FoodServing | null {
  if (!isRecord(value)) return null;
  const amount = positiveNumber(value.amount);
  if (amount === null) return null;
  if (typeof value.unitKey !== "string" || !value.unitKey) return null;
  return { amount, unitKey: value.unitKey };
}

function parseUserFood(value: unknown): FoodItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  const baseUnit =
    typeof value.baseUnit === "string" && BASE_UNITS.includes(value.baseUnit as BaseUnit)
      ? (value.baseUnit as BaseUnit)
      : "g";

  const rawUnits = Array.isArray(value.units) ? value.units : [];
  const units = rawUnits
    .map(parseUnit)
    .filter((unit): unit is FoodUnit => unit !== null)
    .filter((unit) => unit.key !== baseUnit);
  units.push(baseUnit === "ml" ? ML_UNIT : G_UNIT);

  const rawServings = Array.isArray(value.servingOptions)
    ? value.servingOptions
    : [];
  const servingOptions = rawServings
    .map(parseServing)
    .filter((serving): serving is FoodServing => serving !== null);

  const defaultServing =
    parseServing(value.defaultServing) ??
    ({ amount: 100, unitKey: baseUnit } as FoodServing);

  const category =
    typeof value.category === "string" &&
    USER_CATEGORY_IDS.includes(value.category as FoodCategoryId)
      ? (value.category as FoodCategoryId)
      : "user";

  return {
    id: value.id,
    name: value.name.trim(),
    category,
    aliases: Array.isArray(value.aliases)
      ? value.aliases.filter((alias): alias is string => typeof alias === "string")
      : [],
    calories: nonNegativeNumber(value.calories),
    protein: nonNegativeNumber(value.protein),
    fat: nonNegativeNumber(value.fat),
    carbs: nonNegativeNumber(value.carbs),
    baseUnit,
    units,
    servingOptions,
    defaultServing,
    sourceType:
      typeof value.sourceType === "string" &&
      SOURCE_TYPES.includes(value.sourceType as SourceType)
        ? (value.sourceType as SourceType)
        : "user",
    sourceName: typeof value.sourceName === "string" ? value.sourceName : undefined,
    isBranded: value.isBranded === true,
  };
}

export function loadUserFoods(): FoodItem[] {
  const raw = readJson<unknown>(STORAGE_KEYS.userFoods);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseUserFood)
    .filter((item): item is FoodItem => item !== null);
}

export function saveUserFoods(items: FoodItem[]): void {
  writeJson(STORAGE_KEYS.userFoods, items);
}

/* ------------------------------ Profile ------------------------------ */

function parseGender(value: unknown): Gender | null {
  return value === "male" || value === "female" ? value : null;
}

function parseActivity(value: unknown): ActivityLevel | null {
  return typeof value === "string" &&
    ACTIVITY_LEVELS.includes(value as ActivityLevel)
    ? (value as ActivityLevel)
    : null;
}

function parseGoal(value: unknown): Goal | null {
  return typeof value === "string" && GOALS.includes(value as Goal)
    ? (value as Goal)
    : null;
}

export function loadProfile(): UserProfile {
  const raw = readJson<unknown>(STORAGE_KEYS.profile);
  if (!isRecord(raw)) return DEFAULT_PROFILE;
  return {
    gender: parseGender(raw.gender),
    age: positiveNumber(raw.age),
    height: positiveNumber(raw.height),
    weight: positiveNumber(raw.weight),
    activity: parseActivity(raw.activity),
    goal: parseGoal(raw.goal),
  };
}

export function saveProfile(profile: UserProfile): void {
  writeJson(STORAGE_KEYS.profile, profile);
}

/* ------------------------------ Targets ------------------------------ */

function targetField(value: unknown, fallback: number): number {
  return positiveNumber(value) ?? fallback;
}

export function loadTargets(): NutritionTargets {
  const raw = readJson<unknown>(STORAGE_KEYS.targets);
  if (!isRecord(raw)) return DEFAULT_TARGETS;
  return {
    calories: targetField(raw.calories, DEFAULT_TARGETS.calories),
    protein: targetField(raw.protein, DEFAULT_TARGETS.protein),
    fat: targetField(raw.fat, DEFAULT_TARGETS.fat),
    carbs: targetField(raw.carbs, DEFAULT_TARGETS.carbs),
  };
}

export function saveTargets(targets: NutritionTargets): void {
  writeJson(STORAGE_KEYS.targets, targets);
}

/* -------------------------- App preferences -------------------------- */

export function loadUnits(): Units {
  return readJson<unknown>(STORAGE_KEYS.units) === "imperial"
    ? "imperial"
    : "metric";
}

export function saveUnits(units: Units): void {
  writeJson(STORAGE_KEYS.units, units);
}

export function loadOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.onboarded) === "true";
  } catch {
    return false;
  }
}

export function saveOnboarded(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.onboarded, "true");
  } catch {
    // ignore
  }
}
