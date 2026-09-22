/**
 * Stage 14B (delete undo): pure re-insertion of a diary entry.
 *
 * Kept as a standalone .ts module (like recent-foods.ts) so the undo
 * logic is unit-testable without pulling in the React provider.
 */
import type { FoodEntry } from "./types";

/**
 * Returns the SAME array reference when an entry with this id already
 * exists (a no-op the caller can detect via reference equality),
 * otherwise a new array with the exact original entry object appended
 * at the end — same id, createdAt, date, meal, amount, unit and
 * foodType, with no re-stamping.
 */
export function withRestoredEntry(
  previous: readonly FoodEntry[],
  entry: FoodEntry,
): FoodEntry[] {
  if (previous.some((existing) => existing.id === entry.id)) {
    return previous as FoodEntry[];
  }
  return [...previous, entry];
}
