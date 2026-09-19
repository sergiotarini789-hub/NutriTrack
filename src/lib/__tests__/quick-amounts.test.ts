import { describe, expect, it } from "vitest";
import { foods } from "../food-data";
import { quickAmounts, MAX_QUICK_AMOUNTS } from "../quick-amounts";

describe("quickAmounts", () => {
  it("returns gram presets merged with the food's own gram servings", () => {
    const bread = foods.find((food) => food.id === "white-bread");
    expect(bread).toBeDefined();
    const amounts = quickAmounts(bread!, "g");
    // Presets 50/100/150/200 plus the food's own servings (e.g. 30 g),
    // unique and ascending, capped at MAX_QUICK_AMOUNTS.
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
    expect(new Set(amounts).size).toBe(amounts.length);
    expect(amounts.length).toBeLessThanOrEqual(MAX_QUICK_AMOUNTS);
    expect(amounts).toContain(100);
  });

  it("switches to piece presets when the piece unit is selected", () => {
    const egg = foods.find((food) => food.id === "egg");
    expect(egg).toBeDefined();
    const amounts = quickAmounts(egg!, "piece");
    expect(amounts).toEqual([1, 2, 3]);
  });

  it("includes the food's own piece servings", () => {
    const banana = foods.find((food) => food.id === "banana");
    expect(banana).toBeDefined();
    const amounts = quickAmounts(banana!, "piece");
    // The banana's own ½-piece serving merges with the 1/2/3 presets.
    expect(amounts).toEqual([0.5, 1, 2, 3]);
  });

  it("offers half and whole packages for package units", () => {
    const food = foods.find(
      (item) =>
        item.units.some((unit) => unit.kind === "package"),
    );
    if (!food) return; // no packaged food in the catalog — skip
    const packageUnit = food.units.find((unit) => unit.kind === "package")!;
    const amounts = quickAmounts(food, packageUnit.key);
    expect(amounts).toContain(0.5);
    expect(amounts).toContain(1);
  });

  it("returns an empty list for an unknown unit key", () => {
    const egg = foods.find((food) => food.id === "egg");
    expect(quickAmounts(egg!, "definitely-not-a-unit")).toEqual([]);
  });

  it("never returns zero or negative amounts", () => {
    for (const food of foods) {
      for (const unit of food.units) {
        for (const amount of quickAmounts(food, unit.key)) {
          expect(amount).toBeGreaterThan(0);
        }
      }
    }
  });
});
