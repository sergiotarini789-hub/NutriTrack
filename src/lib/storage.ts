import { DEFAULT_PROFILE, DEFAULT_TARGETS } from "./app-data";
import { getFoodById } from "./food-data";
import type {
  ActivityLevel,
  FoodEntry,
  Gender,
  Goal,
  MealType,
  NutritionTargets,
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

/* ------------------------------ Entries ------------------------------ */

function isValidEntry(value: unknown): value is FoodEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.foodId === "string" &&
    getFoodById(value.foodId) !== undefined &&
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

export function loadEntries(): FoodEntry[] {
  const raw = readJson<unknown>(STORAGE_KEYS.entries);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidEntry);
}

export function saveEntries(entries: FoodEntry[]): void {
  writeJson(STORAGE_KEYS.entries, entries);
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
