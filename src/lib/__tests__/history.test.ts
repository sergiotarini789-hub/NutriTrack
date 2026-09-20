import { describe, expect, it } from "vitest";
import { addDays, dateKey, todayKey } from "../dates";
import { getFoodById, foods } from "../food-data";
import { nutritionForServing } from "../nutrition";
import {
  buildHistoryDays,
  dayAverages,
  inNormCount,
  weekDates,
  weekRangeLabel,
} from "../history";
import type { FoodEntry } from "../types";

/** Real lookup over the built-in catalog (same shape as diary findFood). */
const lookup = (id: string) => getFoodById(id);

function entry(
  id: string,
  foodId: string,
  date: string,
  mealType: FoodEntry["mealType"] = "breakfast",
  amount = 100,
  unit = "g",
): FoodEntry {
  return { id, foodId, mealType, amount, unit, date };
}

describe("weekDates", () => {
  it("returns seven days ending today for the current week", () => {
    const dates = weekDates(0);
    expect(dates).toHaveLength(7);
    expect(dateKey(dates[6])).toBe(todayKey());
  });

  it("previous week is the seven days directly before the current one", () => {
    const current = weekDates(0);
    const previous = weekDates(1);
    expect(dateKey(previous[6])).toBe(dateKey(addDays(current[0], -1)));
    expect(dateKey(previous[0])).toBe(dateKey(addDays(current[0], -7)));
  });

  it("never produces future dates for any offset", () => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    for (const offset of [0, 1, 5]) {
      for (const date of weekDates(offset)) {
        expect(date.getTime()).toBeLessThanOrEqual(endOfToday.getTime());
      }
    }
  });
});

describe("weekRangeLabel", () => {
  it("compacts a same-month range", () => {
    const dates = [new Date(2026, 8, 15), new Date(2026, 8, 21)];
    expect(weekRangeLabel(dates)).toBe("15–21 сентября");
  });

  it("spells both months across a month boundary", () => {
    const dates = [new Date(2026, 8, 28), new Date(2026, 9, 4)];
    expect(weekRangeLabel(dates)).toBe("28 сентября – 4 октября");
  });
});

describe("buildHistoryDays", () => {
  it("aggregates a day's entries with the shared nutrition pipeline", () => {
    const date = todayKey();
    const days = buildHistoryDays(
      [entry("1", "egg", date, "breakfast", 2, "piece"), entry("2", "buckwheat", date, "lunch", 150, "g")],
      lookup,
      [new Date()],
    );
    const egg = lookup("egg")!;
    const buckwheat = lookup("buckwheat")!;
    const expectedCalories = Math.round(
      nutritionForServing(egg, 2, "piece").calories +
        nutritionForServing(buckwheat, 150, "g").calories,
    );
    expect(days).toHaveLength(1);
    expect(days[0].calories).toBe(expectedCalories);
    expect(days[0].isToday).toBe(true);
    expect(days[0].protein).toBeGreaterThan(0);
  });

  it("marks empty days with null values and keeps the today flag", () => {
    const yesterday = dateKey(addDays(new Date(), -1));
    const days = buildHistoryDays([], lookup, [addDays(new Date(), -1)]);
    expect(days[0].calories).toBeNull();
    expect(days[0].protein).toBeNull();
    expect(days[0].isToday).toBe(false);
    expect(days[0].dateKey).toBe(yesterday);
  });

  it("rounds fractional totals to whole display values", () => {
    const date = todayKey();
    // 45.5 g of dry buckwheat (330 kcal/100 g) = 150.15 kcal fractional.
    const days = buildHistoryDays(
      [entry("1", "buckwheat", date, "lunch", 45.5, "g")],
      lookup,
      [new Date()],
    );
    expect(Number.isInteger(days[0].calories)).toBe(true);
    expect(days[0].calories).toBe(
      Math.round(nutritionForServing(lookup("buckwheat")!, 45.5, "g").calories),
    );
  });

  it("groups strictly by local date key", () => {
    const today = todayKey();
    const yesterday = dateKey(addDays(new Date(), -1));
    const days = buildHistoryDays(
      [entry("a", "egg", today, "breakfast", 1, "piece"), entry("b", "egg", yesterday, "lunch", 2, "piece")],
      lookup,
      [addDays(new Date(), -1), new Date()],
    );
    expect(days[0].dateKey).toBe(yesterday);
    expect(days[1].dateKey).toBe(today);
    expect(days[0].calories).not.toBe(days[1].calories);
  });
});

describe("dayAverages", () => {
  const day = (calories: number | null, protein = 10, fat = 5, carbs = 50) => ({
    dateKey: "x",
    label: "x",
    weekdayLabel: "x",
    shortWeekday: "x",
    calories,
    protein: calories === null ? null : protein,
    fat: calories === null ? null : fat,
    carbs: calories === null ? null : carbs,
    isToday: false,
  });

  it("averages only days with data — empty days are never zeros", () => {
    const result = dayAverages([day(2000), day(null), day(1000), day(null)]);
    expect(result).not.toBeNull();
    expect(result!.calories).toBe(1500);
    expect(result!.daysWithData).toBe(2);
    expect(result!.protein).toBe(10);
    expect(result!.carbs).toBe(50);
  });

  it("averages macros independently", () => {
    const result = dayAverages([day(1000, 100, 40, 100), day(2000, 200, 60, 300)]);
    expect(result!.protein).toBe(150);
    expect(result!.fat).toBe(50);
    expect(result!.carbs).toBe(200);
  });

  it("returns null when no day has data", () => {
    expect(dayAverages([day(null), day(null)])).toBeNull();
  });

  it("uses real catalog values end-to-end", () => {
    const dates = weekDates(0);
    const entriesForToday = [entry("1", "egg", todayKey(), "breakfast", 2, "piece")];
    const days = buildHistoryDays(entriesForToday, lookup, dates);
    const averages = dayAverages(days)!;
    const expected = Math.round(
      nutritionForServing(lookup("egg")!, 2, "piece").calories,
    );
    expect(averages.calories).toBe(expected);
    expect(averages.daysWithData).toBe(1);
  });
});

describe("inNormCount", () => {
  const day = (calories: number | null) => ({
    dateKey: "x",
    label: "x",
    weekdayLabel: "x",
    shortWeekday: "x",
    calories,
    protein: calories,
    fat: calories,
    carbs: calories,
    isToday: false,
  });

  it("counts days at or below the target as in norm", () => {
    const result = inNormCount([day(2000), day(2060), day(2100)], 2060)!;
    expect(result.count).toBe(2);
    expect(result.daysWithData).toBe(3);
  });

  it("ignores empty days entirely", () => {
    const result = inNormCount([day(2000), day(null), day(3000)], 2060)!;
    expect(result.daysWithData).toBe(2);
    expect(result.count).toBe(1);
  });

  it("returns null for a null target — never invents one", () => {
    expect(inNormCount([day(2000), day(1000)], null)).toBeNull();
  });
});

describe("catalog sanity for history fixtures", () => {
  it("uses real foods (the diary pipeline is not faked)", () => {
    expect(foods.length).toBeGreaterThan(50);
    expect(lookup("egg")).toBeDefined();
    expect(lookup("buckwheat")).toBeDefined();
  });
});
