import { describe, expect, it } from "vitest";
import { recentFoodIds } from "../recent-foods";
import type { FoodEntry } from "../types";

function entry(id: string, foodId: string): FoodEntry {
  return {
    id,
    foodId,
    mealType: "breakfast",
    amount: 100,
    unit: "g",
    date: "2026-09-19",
    createdAt: new Date().toISOString(),
  };
}

describe("recentFoodIds", () => {
  it("returns food ids newest first", () => {
    const ids = recentFoodIds(
      [entry("1", "egg"), entry("2", "banana"), entry("3", "buckwheat")],
      6,
    );
    expect(ids).toEqual(["buckwheat", "banana", "egg"]);
  });

  it("collapses duplicate foods to the most recent occurrence", () => {
    const ids = recentFoodIds(
      [entry("1", "egg"), entry("2", "banana"), entry("3", "egg")],
      6,
    );
    expect(ids).toEqual(["egg", "banana"]);
  });

  it("respects the limit", () => {
    const ids = recentFoodIds(
      [entry("1", "a"), entry("2", "b"), entry("3", "c")],
      2,
    );
    expect(ids).toEqual(["c", "b"]);
  });

  it("returns an empty list for an empty diary (no fabricated data)", () => {
    expect(recentFoodIds([], 6)).toEqual([]);
  });
});
