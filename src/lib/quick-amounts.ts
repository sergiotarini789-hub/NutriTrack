import type { FoodItem, ServingUnitKind } from "./types";

/**
 * Stage 11 — quick-quantity presets for the add-food flow.
 *
 * Pure presentation helper: which amounts make sense as one-tap chips
 * for the CURRENTLY selected unit. It merges the food's own quick-pick
 * servings (same unit only — Stage 10 showed a mixed bag of units)
 * with sensible per-kind presets, deduplicates, sorts and caps the
 * list so the UI never renders a huge button grid.
 *
 * No new serving data is invented: presets are plain amounts of the
 * already-selected unit; everything else comes from the existing
 * servingOptions model.
 */

/** Kind-specific preset amounts (in units of that kind). */
const KIND_PRESETS: Record<ServingUnitKind, readonly number[]> = {
  g: [50, 100, 150, 200],
  ml: [50, 100, 150, 200],
  piece: [1, 2, 3],
  slice: [1, 2, 3],
  serving: [1, 2],
  package: [0.5, 1],
};

/** Maximum chips rendered for one unit. */
export const MAX_QUICK_AMOUNTS = 5;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * One-tap amounts for the given unit of the food: the food's own
 * servings in that unit plus kind presets, unique, ascending, capped.
 * Empty when the unit key is not part of the food's unit model.
 */
export function quickAmounts(food: FoodItem, unitKey: string): number[] {
  const unit = food.units.find((option) => option.key === unitKey);
  if (!unit) return [];

  const candidates = new Set<number>(KIND_PRESETS[unit.kind]);
  for (const serving of food.servingOptions) {
    if (serving.unitKey === unitKey) {
      candidates.add(round2(serving.amount));
    }
  }

  return [...candidates]
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b)
    .slice(0, MAX_QUICK_AMOUNTS);
}
