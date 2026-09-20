import {
  addDays,
  dateKey,
  formatDayMonth,
  lastNDays,
  todayKey,
  weekdayLong,
  weekdayShort,
} from "./dates";
import {
  entriesForDate,
  nutritionOfEntries,
  resolveEntries,
  type FoodLookup,
} from "./nutrition";
import type { FoodEntry, HistoryDayInfo } from "./types";

/**
 * Stage 12 — pure history helpers.
 *
 * History stays DERIVED from the diary (`nutritrack:v1:entries`):
 * no new persistence, no indexes, no target snapshots. A "week" is a
 * rolling 7-day window; offset 0 ends today, offset k is the window
 * shifted back by k×7 days — future dates can never appear.
 */

/**
 * The 7-day window for the given week offset (0 = current week ending
 * today). Ordered from oldest to newest.
 */
export function weekDates(weekOffset: number): Date[] {
  const shift = -7 * Math.max(0, Math.round(weekOffset));
  return lastNDays(7).map((date) => addDays(date, shift));
}

/** «15–21 сентября» within one month, «28 сентября – 4 октября» across. */
export function weekRangeLabel(dates: Date[]): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const sameMonth =
    first.getMonth() === last.getMonth() &&
    first.getFullYear() === last.getFullYear();
  if (sameMonth) {
    return `${first.getDate()}–${formatDayMonth(last)}`;
  }
  return `${formatDayMonth(first)} – ${formatDayMonth(last)}`;
}

/**
 * Aggregates diary entries into display DTOs for the given dates.
 * Values are rounded to whole units for display (Stage 12: history
 * shows whole kcal/grams); days without entries carry nulls. Uses the
 * SAME nutrition pipeline as the Today screen.
 */
export function buildHistoryDays(
  entries: FoodEntry[],
  lookup: FoodLookup,
  dates: Date[],
): HistoryDayInfo[] {
  const today = todayKey();
  return dates.map((date) => {
    const key = dateKey(date);
    const dayEntries = entriesForDate(entries, key);
    if (dayEntries.length === 0) {
      return {
        dateKey: key,
        label: formatDayMonth(date),
        weekdayLabel: weekdayLong(date),
        shortWeekday: weekdayShort(date),
        calories: null,
        protein: null,
        fat: null,
        carbs: null,
        isToday: key === today,
      };
    }
    const totals = nutritionOfEntries(resolveEntries(dayEntries, lookup));
    return {
      dateKey: key,
      label: formatDayMonth(date),
      weekdayLabel: weekdayLong(date),
      shortWeekday: weekdayShort(date),
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      fat: Math.round(totals.fat),
      carbs: Math.round(totals.carbs),
      isToday: key === today,
    };
  });
}

/** Day-level averages. Only days WITH diary data participate — empty
 *  days are never counted as zero. Null when no day has data. */
export interface DayAverages {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  daysWithData: number;
}

export function dayAverages(days: HistoryDayInfo[]): DayAverages | null {
  const withData = days.filter((day) => day.calories !== null);
  if (withData.length === 0) return null;
  const mean = (pick: (day: HistoryDayInfo) => number | null): number =>
    Math.round(
      withData.reduce((sum, day) => sum + (pick(day) ?? 0), 0) /
        withData.length,
    );
  return {
    calories: mean((day) => day.calories),
    protein: mean((day) => day.protein),
    fat: mean((day) => day.fat),
    carbs: mean((day) => day.carbs),
    daysWithData: withData.length,
  };
}

/**
 * "В норме" statistics with the unchanged rule: a day with data is in
 * norm when its calories are <= the target. Null target → null (never
 * an invented target).
 */
export function inNormCount(
  days: HistoryDayInfo[],
  target: number | null,
): { count: number; daysWithData: number } | null {
  if (target === null) return null;
  const values = days
    .map((day) => day.calories)
    .filter((calories): calories is number => calories !== null);
  return {
    count: values.filter((value) => value <= target).length,
    daysWithData: values.length,
  };
}
