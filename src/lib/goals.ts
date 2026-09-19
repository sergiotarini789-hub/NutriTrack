import type {
  ActivityLevel,
  Goal,
  NutritionGoals,
  NutritionTargets,
  TargetMode,
  UserProfile,
} from "./types";

/* ------------------------------------------------------------------ */
/* Stage 9: nutrition-goal calculation engine                          */
/*                                                                    */
/* Pure, deterministic functions only — no React, no storage, no      */
/* side effects. The Settings screen, the onboarding wizard and the   */
/* dashboard all consume targets derived through this single module   */
/* (one source of truth via the diary provider).                      */
/* ------------------------------------------------------------------ */

/**
 * Activity level → TDEE multiplier. Centralized on purpose: React
 * components must never carry these magic numbers.
 */
export const ACTIVITY_FACTORS: Readonly<Record<ActivityLevel, number>> = {
  minimal: 1.2,
  low: 1.375,
  medium: 1.55,
  high: 1.725,
  very_high: 1.9,
};

/**
 * Goal → calorie adjustment applied to TDEE, centralized:
 * Похудение −15 %, Поддержание ±0 %, Набор массы +10 %.
 */
export const GOAL_FACTORS: Readonly<Record<Goal, number>> = {
  lose: 0.85,
  maintain: 1,
  gain: 1.1,
};

/** Macro grams per kilogram of body weight. */
export const PROTEIN_PER_KG = 2;
export const FAT_PER_KG = 0.8;

/** Atwater energy densities, kcal per gram. */
const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_FAT = 9;
const KCAL_PER_G_CARB = 4;

/**
 * Sensible application boundaries for body parameters. Values outside
 * these ranges are treated as missing (the profile is incomplete), so
 * no personalized target is ever calculated from nonsense input.
 */
export const PROFILE_LIMITS = {
  age: { min: 13, max: 100 },
  height: { min: 100, max: 250 },
  weight: { min: 30, max: 350 },
} as const;

/** Profile fields the goal calculation needs. */
export type ProfileField =
  | "gender"
  | "age"
  | "height"
  | "weight"
  | "activity"
  | "goal";

const FIELD_BOUNDARY_MESSAGES: Readonly<
  Record<keyof typeof PROFILE_LIMITS, string>
> = {
  age: `Возраст должен быть от ${PROFILE_LIMITS.age.min} до ${PROFILE_LIMITS.age.max} лет`,
  height: `Рост должен быть от ${PROFILE_LIMITS.height.min} до ${PROFILE_LIMITS.height.max} см`,
  weight: `Вес должен быть от ${PROFILE_LIMITS.weight.min} до ${PROFILE_LIMITS.weight.max} кг`,
};

/**
 * Russian validation message for a numeric profile value, or null when
 * the value is within the application boundaries. Used by Settings and
 * onboarding so both validate identically.
 */
export function profileFieldError(
  field: keyof typeof PROFILE_LIMITS,
  value: number,
): string | null {
  const limits = PROFILE_LIMITS[field];
  if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
    return FIELD_BOUNDARY_MESSAGES[field];
  }
  return null;
}

/** True when a numeric profile field is present and within boundaries. */
function bodyFieldValid(
  profile: UserProfile,
  field: keyof typeof PROFILE_LIMITS,
): boolean {
  const value = profile[field];
  return value !== null && profileFieldError(field, value) === null;
}

/**
 * Profile fields that are missing or invalid, in a stable order.
 * An empty array means the profile is complete and calculable.
 */
export function missingProfileFields(profile: UserProfile): ProfileField[] {
  const missing: ProfileField[] = [];
  if (profile.gender === null) missing.push("gender");
  if (!bodyFieldValid(profile, "age")) missing.push("age");
  if (!bodyFieldValid(profile, "height")) missing.push("height");
  if (!bodyFieldValid(profile, "weight")) missing.push("weight");
  if (profile.activity === null) missing.push("activity");
  if (profile.goal === null) missing.push("goal");
  return missing;
}

/** True when every field needed for the calculation is present and valid. */
export function isProfileComplete(profile: UserProfile): boolean {
  return missingProfileFields(profile).length === 0;
}

/**
 * Basal metabolic rate by the Mifflin–St Jeor equation:
 * men     10×weight + 6.25×height − 5×age + 5
 * women   10×weight + 6.25×height − 5×age − 161
 * Returns null when the required fields are missing/invalid — never a
 * number invented from placeholder values.
 */
export function calculateBmr(profile: UserProfile): number | null {
  const { gender, age, height, weight } = profile;
  if (gender === null || age === null || height === null || weight === null) {
    return null;
  }
  if (
    profileFieldError("age", age) !== null ||
    profileFieldError("height", height) !== null ||
    profileFieldError("weight", weight) !== null
  ) {
    return null;
  }
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/**
 * Total daily energy expenditure: BMR × activity factor. The
 * intermediate value is NOT rounded — only the final calorie target is.
 * Returns null when BMR or the activity level is unavailable.
 */
export function calculateTdee(profile: UserProfile): number | null {
  const bmr = calculateBmr(profile);
  if (bmr === null || profile.activity === null) return null;
  return bmr * ACTIVITY_FACTORS[profile.activity];
}

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Daily calorie target: TDEE × goal adjustment, rounded to the nearest
 * 10 kcal for a readable target. Returns null when the profile is not
 * complete enough to compute TDEE and the goal.
 */
export function calculateCalorieTarget(profile: UserProfile): number | null {
  const tdee = calculateTdee(profile);
  if (tdee === null || profile.goal === null) return null;
  return roundToStep(tdee * GOAL_FACTORS[profile.goal], 10);
}

/**
 * Full nutrition goals for a complete profile: calorie target plus
 * macros derived from body weight (protein 2 g/kg, fat 0.8 g/kg,
 * carbohydrates fill the remaining calories). Returns null whenever the
 * profile is incomplete — no fake personalized numbers.
 */
export function calculateNutritionGoals(
  profile: UserProfile,
): NutritionGoals | null {
  if (!isProfileComplete(profile)) return null;
  const bmr = calculateBmr(profile);
  const tdee = calculateTdee(profile);
  const calories = calculateCalorieTarget(profile);
  // Guaranteed non-null by isProfileComplete; kept defensive anyway.
  if (bmr === null || tdee === null || calories === null) return null;

  const protein = Math.round(PROTEIN_PER_KG * (profile.weight as number));
  const fat = Math.round(FAT_PER_KG * (profile.weight as number));
  const proteinCalories = protein * KCAL_PER_G_PROTEIN;
  const fatCalories = fat * KCAL_PER_G_FAT;
  const carbCalories = calories - proteinCalories - fatCalories;
  // Explicit edge handling: an extreme deficit could leave no calories
  // for carbohydrates — clamp at zero instead of returning nonsense.
  const carbs = Math.max(0, Math.round(carbCalories / KCAL_PER_G_CARB));

  return {
    calories,
    protein,
    fat,
    carbs,
    bmr: round1(bmr),
    tdee: round1(tdee),
  };
}

/**
 * The single resolver the diary provider uses for the effective daily
 * targets (Settings and the dashboard consume its result — never their
 * own calculations):
 * - manual mode → the stored manual targets, untouched by profile edits;
 * - auto mode with a complete profile → calculated goals;
 * - auto mode with an incomplete profile → null: NO target. Missing
 *   profile data must never be presented as a personalized target, so
 *   the legacy default targets are deliberately NOT used as a fallback
 *   here — the UI shows an incomplete-profile state instead.
 */
export function resolveEffectiveTargets(
  profile: UserProfile,
  mode: TargetMode,
  manualTargets: NutritionTargets,
): NutritionTargets | null {
  if (mode === "manual") return manualTargets;
  return calculateNutritionGoals(profile);
}
