import type { FoodEntry } from "./types";

/**
 * Stage 11 — recently used foods for the add-food flow.
 *
 * Pure helper over the EXISTING diary data: no new persistence, no
 * usage counters. The diary stores entries in chronological append
 * order, so walking from the end yields the most recently added foods
 * first. Duplicates (same food added several times) collapse to one
 * row. No fallback data is fabricated — an empty diary yields an
 * empty list and the UI simply hides the section.
 */

/** Food ids the user logged most recently, newest first, unique, capped. */
export function recentFoodIds(entries: readonly FoodEntry[], limit: number): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (let i = entries.length - 1; i >= 0 && ids.length < limit; i--) {
    const id = entries[i].foodId;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
