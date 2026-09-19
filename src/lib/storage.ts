import { EMPTY_PROFILE, DEFAULT_TARGETS } from "./app-data";
import { profileFieldError } from "./goals";
import { G_UNIT, ML_UNIT } from "./food-data";
import { normalizeBarcode } from "./barcode";
import type {
  ActivityLevel,
  BaseUnit,
  BrandedProduct,
  FoodCategoryId,
  FoodEntry,
  FoodProductType,
  FoodServing,
  FoodUnit,
  Gender,
  Goal,
  MealType,
  NutritionTargets,
  TargetMode,
  UserProfile,
  UserProduct,
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
  /**
   * Normalized Open Food Facts products fetched earlier (Stage 7).
   * Additive key: never renames or replaces existing data; entries
   * reference these products by id ("off-<barcode>").
   */
  offProducts: `${PREFIX}:off-products`,
  /**
   * Stage 9: whether daily targets are calculated from the profile
   * ("auto") or manually set by the user ("manual"). Additive key —
   * existing data is never renamed or dropped.
   */
  targetMode: `${PREFIX}:target-mode`,
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

const FOOD_TYPES: readonly FoodProductType[] = ["generic", "branded", "user"];

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
 * Optional `foodType`/`createdAt` fields (Stage 6) are kept when valid
 * and dropped otherwise; the migration is idempotent.
 */
export function loadEntries(): FoodEntry[] {
  const raw = readJson<unknown>(STORAGE_KEYS.entries);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidEntry).map((entry) => ({
    ...entry,
    unit: typeof entry.unit === "string" && entry.unit ? entry.unit : "g",
    foodType:
      typeof entry.foodType === "string" &&
      FOOD_TYPES.includes(entry.foodType as FoodProductType)
        ? (entry.foodType as FoodProductType)
        : undefined,
    createdAt:
      typeof entry.createdAt === "string" && entry.createdAt
        ? entry.createdAt
        : undefined,
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

/**
 * Parses a stored user product. Tolerates the pre-Stage-6 format (no
 * `type` discriminator / brand / barcode fields): the discriminator is
 * always injected, so re-saving produces the new format — idempotently.
 */
function parseUserProduct(value: unknown): UserProduct | null {
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
    // Discriminator (injected for old records; user products stay user).
    type: "user",
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
    sourceType: "user",
    sourceName: typeof value.sourceName === "string" ? value.sourceName : undefined,
    isBranded: value.isBranded === true,
    brand:
      typeof value.brand === "string" && value.brand.trim()
        ? value.brand.trim().slice(0, 80)
        : undefined,
    manufacturer:
      typeof value.manufacturer === "string" && value.manufacturer.trim()
        ? value.manufacturer.trim().slice(0, 80)
        : undefined,
    barcode: normalizeBarcode(
      typeof value.barcode === "string" ? value.barcode : undefined,
    ),
    ingredients:
      typeof value.ingredients === "string" && value.ingredients.trim()
        ? value.ingredients.trim().slice(0, 500)
        : undefined,
    packageSize: positiveNumber(value.packageSize) ?? undefined,
    packageUnit:
      typeof value.packageUnit === "string" && value.packageUnit.trim()
        ? value.packageUnit.trim()
        : undefined,
    createdAt:
      typeof value.createdAt === "string" && value.createdAt
        ? value.createdAt
        : undefined,
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt
        ? value.updatedAt
        : undefined,
  };
}

export function loadUserFoods(): UserProduct[] {
  const raw = readJson<unknown>(STORAGE_KEYS.userFoods);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseUserProduct)
    .filter((item): item is UserProduct => item !== null);
}

export function saveUserFoods(items: UserProduct[]): void {
  writeJson(STORAGE_KEYS.userFoods, items);
}

/* ---------------------- Open Food Facts products -------------------- */

/** Categories an external branded product may use ("user" is reserved). */
const BRANDED_CATEGORY_IDS: readonly FoodCategoryId[] = [
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

/**
 * Parses a stored Open Food Facts product (normalized BrandedProduct
 * as produced by the server route). Tolerant like parseUserProduct:
 * malformed records are dropped, not thrown. Only records that really
 * come from Open Food Facts are accepted — nothing else may live in
 * this store.
 */
function parseOffProduct(value: unknown): BrandedProduct | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || !value.id) return null;
  if (typeof value.name !== "string" || !value.name.trim()) return null;
  if (value.type !== "branded" || value.sourceType !== "open_food_facts") {
    return null;
  }
  // Stage 8B: products without any nutrition data are valid — all four
  // fields are absent together (unknown, never a fake zero). A record
  // with SOME nutrition must still carry a valid calories number.
  const nutritionAbsent =
    value.calories === undefined &&
    value.protein === undefined &&
    value.fat === undefined &&
    value.carbs === undefined;
  if (!nutritionAbsent) {
    if (
      typeof value.calories !== "number" ||
      !Number.isFinite(value.calories) ||
      value.calories < 0
    ) {
      return null;
    }
  }
  const calories = nutritionAbsent ? undefined : (value.calories as number);

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
    BRANDED_CATEGORY_IDS.includes(value.category as FoodCategoryId)
      ? (value.category as FoodCategoryId)
      : "ready";

  return {
    type: "branded",
    id: value.id,
    name: value.name.trim().slice(0, 120),
    category,
    aliases: [],
    calories,
    // With nutrition: missing macros flatten to 0 (existing rule).
    // Without nutrition: all stay undefined — unknown ≠ zero.
    protein: nutritionAbsent ? undefined : nonNegativeNumber(value.protein),
    fat: nutritionAbsent ? undefined : nonNegativeNumber(value.fat),
    carbs: nutritionAbsent ? undefined : nonNegativeNumber(value.carbs),
    baseUnit,
    units,
    servingOptions,
    defaultServing,
    sourceType: "open_food_facts",
    sourceName:
      typeof value.sourceName === "string" ? value.sourceName : undefined,
    sourceId: typeof value.sourceId === "string" ? value.sourceId : undefined,
    isBranded: true,
    brand:
      typeof value.brand === "string" && value.brand.trim()
        ? value.brand.trim().slice(0, 80)
        : undefined,
    manufacturer:
      typeof value.manufacturer === "string" && value.manufacturer.trim()
        ? value.manufacturer.trim().slice(0, 80)
        : undefined,
    barcode: normalizeBarcode(
      typeof value.barcode === "string" ? value.barcode : undefined,
    ),
    ingredients:
      typeof value.ingredients === "string" && value.ingredients.trim()
        ? value.ingredients.trim().slice(0, 500)
        : undefined,
    packageSize: positiveNumber(value.packageSize) ?? undefined,
    packageUnit:
      typeof value.packageUnit === "string" && value.packageUnit.trim()
        ? value.packageUnit.trim()
        : undefined,
    imageUrl:
      typeof value.imageUrl === "string" && /^https?:\/\//.test(value.imageUrl)
        ? value.imageUrl
        : undefined,
    verified: value.verified === true,
    createdAt:
      typeof value.createdAt === "string" && value.createdAt
        ? value.createdAt
        : undefined,
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt
        ? value.updatedAt
        : undefined,
  };
}

export function loadOffProducts(): BrandedProduct[] {
  const raw = readJson<unknown>(STORAGE_KEYS.offProducts);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseOffProduct)
    .filter((item): item is BrandedProduct => item !== null);
}

export function saveOffProducts(items: BrandedProduct[]): void {
  writeJson(STORAGE_KEYS.offProducts, items);
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

/**
 * Numeric body fields are only kept when they are inside the
 * application boundaries (see PROFILE_LIMITS); out-of-range values are
 * treated as missing so no goal is ever calculated from nonsense.
 */
function boundedNumber(
  field: "age" | "height" | "weight",
  value: unknown,
): number | null {
  const parsed = positiveNumber(value);
  if (parsed === null) return null;
  return profileFieldError(field, parsed) === null ? parsed : null;
}

export function loadProfile(): UserProfile {
  const raw = readJson<unknown>(STORAGE_KEYS.profile);
  if (!isRecord(raw)) return EMPTY_PROFILE;
  return {
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim().slice(0, 40)
        : undefined,
    gender: parseGender(raw.gender),
    age: boundedNumber("age", raw.age),
    height: boundedNumber("height", raw.height),
    weight: boundedNumber("weight", raw.weight),
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

/* --------------------------- Target mode ---------------------------- */

/**
 * Loads how daily targets are determined (Stage 9).
 *
 * Migration for data saved before modes existed: an explicitly stored
 * mode always wins. Otherwise a user whose stored targets differ from
 * the legacy defaults had customized them manually — their values are
 * preserved as "manual". Everyone else starts with "auto" so goals
 * become calculated from the profile.
 */
export function loadTargetMode(): TargetMode {
  const rawMode = readJson<unknown>(STORAGE_KEYS.targetMode);
  if (rawMode === "auto" || rawMode === "manual") return rawMode;

  const stored = readJson<unknown>(STORAGE_KEYS.targets);
  if (isRecord(stored)) {
    const customized = (
      ["calories", "protein", "fat", "carbs"] as const
    ).some(
      (field) =>
        targetField(stored[field], DEFAULT_TARGETS[field]) !==
        DEFAULT_TARGETS[field],
    );
    if (customized) return "manual";
  }
  return "auto";
}

export function saveTargetMode(mode: TargetMode): void {
  writeJson(STORAGE_KEYS.targetMode, mode);
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
