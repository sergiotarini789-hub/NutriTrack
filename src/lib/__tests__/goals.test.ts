import { describe, expect, it } from "vitest";
import {
  ACTIVITY_FACTORS,
  GOAL_FACTORS,
  PROFILE_LIMITS,
  calculateBmr,
  calculateCalorieTarget,
  calculateNutritionGoals,
  calculateTdee,
  isProfileComplete,
  missingProfileFields,
  profileFieldError,
  resolveEffectiveTargets,
} from "../goals";
import { EMPTY_PROFILE, DEFAULT_TARGETS } from "../app-data";
import type { NutritionTargets, UserProfile } from "../types";

/**
 * Stage 9 tests — the nutrition-goal calculation engine (pure
 * functions; Mifflin–St Jeor BMR, activity factors, goal adjustments,
 * weight-based macros) and the effective-target resolver the diary
 * provider (and through it the dashboard and Settings) consumes.
 */

/** The Stage 9 reference profile: male, 28, 176 cm, 75 kg, sedentary, maintain. */
function referenceProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    gender: "male",
    age: 28,
    height: 176,
    weight: 75,
    activity: "minimal",
    goal: "maintain",
    ...overrides,
  };
}

/** BMR = 10×75 + 6.25×176 − 5×28 + 5 = 750 + 1100 − 140 + 5 = 1715. */
const MALE_BMR = 1715;
/** Female BMR is 166 lower (−161 instead of +5). */
const FEMALE_BMR = 1549;

describe("activity and goal constants", () => {
  it("uses the documented activity multipliers", () => {
    expect(ACTIVITY_FACTORS.minimal).toBe(1.2);
    expect(ACTIVITY_FACTORS.low).toBe(1.375);
    expect(ACTIVITY_FACTORS.medium).toBe(1.55);
    expect(ACTIVITY_FACTORS.high).toBe(1.725);
    expect(ACTIVITY_FACTORS.very_high).toBe(1.9);
  });

  it("uses the documented goal adjustments (−15 % / 0 / +10 %)", () => {
    expect(GOAL_FACTORS.lose).toBe(0.85);
    expect(GOAL_FACTORS.maintain).toBe(1);
    expect(GOAL_FACTORS.gain).toBe(1.1);
  });
});

describe("profile validation", () => {
  it("reports boundary violations with Russian messages", () => {
    expect(profileFieldError("age", 12)).toBe("Возраст должен быть от 13 до 100 лет");
    expect(profileFieldError("age", 101)).toBe("Возраст должен быть от 13 до 100 лет");
    expect(profileFieldError("age", 13)).toBeNull();
    expect(profileFieldError("age", 100)).toBeNull();
    expect(profileFieldError("height", 99)).toBe("Рост должен быть от 100 до 250 см");
    expect(profileFieldError("height", 251)).toBe("Рост должен быть от 100 до 250 см");
    expect(profileFieldError("height", 176)).toBeNull();
    expect(profileFieldError("weight", 29)).toBe("Вес должен быть от 30 до 350 кг");
    expect(profileFieldError("weight", 351)).toBe("Вес должен быть от 30 до 350 кг");
    expect(profileFieldError("weight", 75)).toBeNull();
    expect(profileFieldError("age", Number.NaN)).toBe(
      "Возраст должен быть от 13 до 100 лет",
    );
  });

  it("exposes the application boundaries", () => {
    expect(PROFILE_LIMITS.age).toEqual({ min: 13, max: 100 });
    expect(PROFILE_LIMITS.height).toEqual({ min: 100, max: 250 });
    expect(PROFILE_LIMITS.weight).toEqual({ min: 30, max: 350 });
  });

  it("lists missing fields in a stable order", () => {
    expect(missingProfileFields(EMPTY_PROFILE)).toEqual([
      "gender",
      "age",
      "height",
      "weight",
      "activity",
      "goal",
    ]);
    expect(missingProfileFields(referenceProfile())).toEqual([]);
    // Out-of-range values count as missing too.
    expect(missingProfileFields(referenceProfile({ age: 5 }))).toEqual(["age"]);
    expect(isProfileComplete(referenceProfile())).toBe(true);
    expect(isProfileComplete(referenceProfile({ weight: 400 }))).toBe(false);
    expect(isProfileComplete(EMPTY_PROFILE)).toBe(false);
  });
});

describe("calculateBmr (Mifflin–St Jeor)", () => {
  it("computes the male BMR exactly", () => {
    expect(calculateBmr(referenceProfile())).toBe(MALE_BMR);
  });

  it("computes the female BMR exactly (−166 vs male)", () => {
    expect(calculateBmr(referenceProfile({ gender: "female" }))).toBe(
      FEMALE_BMR,
    );
  });

  it("is deterministic", () => {
    const profile = referenceProfile();
    expect(calculateBmr(profile)).toBe(calculateBmr(profile));
  });

  it("returns null for missing or invalid fields", () => {
    expect(calculateBmr(EMPTY_PROFILE)).toBeNull();
    expect(calculateBmr(referenceProfile({ gender: null }))).toBeNull();
    expect(calculateBmr(referenceProfile({ age: null }))).toBeNull();
    expect(calculateBmr(referenceProfile({ height: null }))).toBeNull();
    expect(calculateBmr(referenceProfile({ weight: null }))).toBeNull();
    expect(calculateBmr(referenceProfile({ age: 0 }))).toBeNull();
    expect(calculateBmr(referenceProfile({ age: -28 }))).toBeNull();
    expect(calculateBmr(referenceProfile({ height: 40 }))).toBeNull();
    expect(calculateBmr(referenceProfile({ weight: 10 }))).toBeNull();
  });

  it("changes with every body parameter", () => {
    const base = calculateBmr(referenceProfile());
    expect(base).not.toBeNull();
    if (base === null) return;
    // Weight 75 → 80 kg: +10 kcal per kg.
    expect(calculateBmr(referenceProfile({ weight: 80 }))).toBe(base + 50);
    // Height 176 → 185 cm: +6.25 kcal per cm.
    expect(calculateBmr(referenceProfile({ height: 185 }))).toBe(base + 56.25);
    // Age 28 → 35 years: −5 kcal per year.
    expect(calculateBmr(referenceProfile({ age: 35 }))).toBe(base - 35);
    // Sex male → female: −166.
    expect(calculateBmr(referenceProfile({ gender: "female" }))).toBe(
      base - 166,
    );
  });
});

describe("calculateTdee", () => {
  it("multiplies BMR by every activity factor", () => {
    const profile = referenceProfile();
    expect(calculateTdee(profile)).toBeCloseTo(MALE_BMR * 1.2, 6);
    expect(calculateTdee({ ...profile, activity: "low" })).toBeCloseTo(
      MALE_BMR * 1.375,
      6,
    );
    expect(calculateTdee({ ...profile, activity: "medium" })).toBeCloseTo(
      MALE_BMR * 1.55,
      6,
    );
    expect(calculateTdee({ ...profile, activity: "high" })).toBeCloseTo(
      MALE_BMR * 1.725,
      6,
    );
    expect(calculateTdee({ ...profile, activity: "very_high" })).toBeCloseTo(
      MALE_BMR * 1.9,
      6,
    );
  });

  it("returns null without BMR inputs or activity", () => {
    expect(calculateTdee(EMPTY_PROFILE)).toBeNull();
    expect(calculateTdee(referenceProfile({ activity: null }))).toBeNull();
  });

  it("does not round the intermediate value", () => {
    // 1715 × 1.375 = 2358.125 — kept unrounded for the calorie target.
    expect(calculateTdee(referenceProfile({ activity: "low" }))).toBe(
      2358.125,
    );
  });
});

describe("calculateCalorieTarget", () => {
  it("applies the goal adjustment and rounds to the nearest 10 kcal", () => {
    // TDEE 2058: maintain 2058 → 2060, lose 1749.3 → 1750, gain 2263.8 → 2260.
    expect(calculateCalorieTarget(referenceProfile())).toBe(2060);
    expect(calculateCalorieTarget(referenceProfile({ goal: "lose" }))).toBe(
      1750,
    );
    expect(calculateCalorieTarget(referenceProfile({ goal: "gain" }))).toBe(
      2260,
    );
  });

  it("returns null for incomplete profiles", () => {
    expect(calculateCalorieTarget(EMPTY_PROFILE)).toBeNull();
    expect(calculateCalorieTarget(referenceProfile({ goal: null }))).toBeNull();
    expect(calculateCalorieTarget(referenceProfile({ age: 120 }))).toBeNull();
  });
});

describe("calculateNutritionGoals", () => {
  it("computes the full reference result (male, maintain)", () => {
    const goals = calculateNutritionGoals(referenceProfile());
    expect(goals).not.toBeNull();
    expect(goals?.calories).toBe(2060);
    expect(goals?.bmr).toBe(1715);
    expect(goals?.tdee).toBe(2058);
    // Protein 2 g/kg × 75 = 150 g; fat 0.8 g/kg × 75 = 60 g;
    // carbs (2060 − 600 − 540) / 4 = 230 g.
    expect(goals?.protein).toBe(150);
    expect(goals?.fat).toBe(60);
    expect(goals?.carbs).toBe(230);
  });

  it("computes the female reference result", () => {
    const goals = calculateNutritionGoals(
      referenceProfile({ gender: "female" }),
    );
    expect(goals?.bmr).toBe(FEMALE_BMR);
    expect(goals?.tdee).toBeCloseTo(FEMALE_BMR * 1.2, 1);
    // 1858.8 → 1860 kcal; same weight → same protein/fat grams.
    expect(goals?.calories).toBe(1860);
    expect(goals?.protein).toBe(150);
    expect(goals?.fat).toBe(60);
    // (1860 − 600 − 540) / 4 = 180 g.
    expect(goals?.carbs).toBe(180);
  });

  it("changes the calorie target when only the goal changes", () => {
    const before = calculateNutritionGoals(referenceProfile());
    const after = calculateNutritionGoals(
      referenceProfile({ goal: "gain" }),
    );
    expect(after?.calories).toBe(2260);
    // Same weight → same protein; extra calories land in carbs.
    expect(after?.protein).toBe(before?.protein);
    expect(after?.carbs).toBe(280);
  });

  it("changes BMR/TDEE/macros when only the weight changes (75 → 80 kg)", () => {
    const after = calculateNutritionGoals(referenceProfile({ weight: 80 }));
    // BMR 1715 → 1765; TDEE 2058 → 2118.
    expect(after?.bmr).toBe(1765);
    expect(after?.tdee).toBeCloseTo(2118, 1);
    // Protein 160, fat 64; calories 2118 → 2120.
    expect(after?.calories).toBe(2120);
    expect(after?.protein).toBe(160);
    expect(after?.fat).toBe(64);
    // Carbs (2120 − 640 − 576) / 4 = 226 g.
    expect(after?.carbs).toBe(226);
  });

  it("changes BMR/TDEE when only the height changes (176 → 185 cm)", () => {
    const after = calculateNutritionGoals(referenceProfile({ height: 185 }));
    // BMR 1771.25 (reported rounded to 1 decimal); TDEE 2125.5.
    expect(after?.bmr).toBe(1771.3);
    expect(after?.tdee).toBeCloseTo(1771.25 * 1.2, 0);
  });

  it("changes BMR when only the age changes (28 → 35)", () => {
    const after = calculateNutritionGoals(referenceProfile({ age: 35 }));
    expect(after?.bmr).toBe(1715 - 35);
  });

  it("changes TDEE and the calorie target when only the activity changes", () => {
    const after = calculateNutritionGoals(
      referenceProfile({ activity: "medium" }),
    );
    // TDEE 2658.25 (reported rounded to 1 decimal as 2658.3).
    expect(after?.tdee).toBeCloseTo(1715 * 1.55, 0);
    expect(after?.calories).toBe(2660);
  });

  it("changes BMR when only the sex changes", () => {
    const after = calculateNutritionGoals(
      referenceProfile({ gender: "female" }),
    );
    expect(after?.bmr).toBe(FEMALE_BMR);
  });

  it("handles the extreme deficit edge case explicitly (carbs clamp to 0)", () => {
    // Smallest valid profile on a cut: BMR 264, TDEE 316.8, target 270
    // kcal while protein+fat already need 456 kcal — carbs clamp to 0
    // instead of going negative.
    const goals = calculateNutritionGoals({
      gender: "female",
      age: 100,
      height: 100,
      weight: 30,
      activity: "minimal",
      goal: "lose",
    });
    expect(goals).not.toBeNull();
    expect(goals?.calories).toBe(270);
    expect(goals?.protein).toBe(60);
    expect(goals?.fat).toBe(24);
    expect(goals?.carbs).toBe(0);
  });

  it("never invents goals for incomplete or invalid profiles", () => {
    expect(calculateNutritionGoals(EMPTY_PROFILE)).toBeNull();
    expect(
      calculateNutritionGoals(referenceProfile({ activity: null })),
    ).toBeNull();
    expect(
      calculateNutritionGoals(referenceProfile({ weight: 500 })),
    ).toBeNull();
    expect(calculateNutritionGoals(referenceProfile({ age: 7 }))).toBeNull();
  });

  it("is deterministic across calls", () => {
    const profile = referenceProfile({ activity: "medium", goal: "gain" });
    expect(calculateNutritionGoals(profile)).toEqual(
      calculateNutritionGoals(profile),
    );
  });
});

describe("resolveEffectiveTargets (dashboard target source)", () => {
  const manual: NutritionTargets = {
    calories: 2500,
    protein: 120,
    fat: 80,
    carbs: 300,
  };

  it("auto mode with a complete profile returns calculated targets", () => {
    const resolved = resolveEffectiveTargets(
      referenceProfile(),
      "auto",
      manual,
    );
    expect(resolved).not.toBeNull();
    if (resolved === null) return;
    expect(resolved.calories).toBe(2060);
    expect(resolved.protein).toBe(150);
  });

  it("auto mode recalculates when profile values change", () => {
    // The dashboard consumes exactly this function's output — changing
    // profile values must change the effective target.
    const before = resolveEffectiveTargets(referenceProfile(), "auto", manual);
    const afterGoal = resolveEffectiveTargets(
      referenceProfile({ goal: "gain" }),
      "auto",
      manual,
    );
    const afterWeight = resolveEffectiveTargets(
      referenceProfile({ weight: 80 }),
      "auto",
      manual,
    );
    expect(before).not.toBeNull();
    expect(afterGoal).not.toBeNull();
    expect(afterWeight).not.toBeNull();
    if (before === null || afterGoal === null || afterWeight === null) return;
    expect(afterGoal.calories).not.toBe(before.calories);
    expect(afterWeight.calories).not.toBe(before.calories);
    expect(afterGoal.calories).toBe(2260);
    expect(afterWeight.calories).toBe(2120);
  });

  it("manual mode keeps manual targets regardless of profile changes", () => {
    const resolved = resolveEffectiveTargets(
      referenceProfile({ goal: "gain", weight: 120 }),
      "manual",
      manual,
    );
    expect(resolved).toEqual(manual);
  });

  it("auto mode with an incomplete profile returns NO target — never the legacy 2100", () => {
    // Neither stored manual values nor the legacy defaults may act as
    // an automatic target for an incomplete profile (Stage 9 review).
    expect(resolveEffectiveTargets(EMPTY_PROFILE, "auto", manual)).toBeNull();
    expect(
      resolveEffectiveTargets(EMPTY_PROFILE, "auto", DEFAULT_TARGETS),
    ).toBeNull();
    // Also for partially filled / invalid profiles.
    expect(
      resolveEffectiveTargets(
        referenceProfile({ activity: null }),
        "auto",
        manual,
      ),
    ).toBeNull();
    expect(
      resolveEffectiveTargets(referenceProfile({ age: 5 }), "auto", manual),
    ).toBeNull();
  });

  it("complete profile produces calculated targets in auto mode", () => {
    const resolved = resolveEffectiveTargets(
      referenceProfile(),
      "auto",
      DEFAULT_TARGETS,
    );
    expect(resolved).not.toBeNull();
    expect(resolved?.calories).toBe(2060);
    expect(resolved?.protein).toBe(150);
  });
});
