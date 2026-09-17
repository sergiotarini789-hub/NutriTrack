import { describe, expect, it } from "vitest";
import { getFoodById } from "../food-data";
import {
  nutritionForBaseAmount,
  nutritionForServing,
  resolveEntries,
  resolveFoodEntry,
  servingsOf,
  sourceLabelOf,
  sourceOf,
  foodTypeOf,
  nutritionOf,
} from "../nutrition";
import type { FoodEntry, UserProduct } from "../types";

const egg = getFoodById("egg");
const milk = getFoodById("milk-2.5");
const buckwheat = getFoodById("buckwheat");
const banana = getFoodById("banana");

if (!egg || !milk || !buckwheat || !banana) {
  throw new Error("reference foods missing from the database");
}

/** A user product shaped like the old custom-food format. */
const userProduct: UserProduct = {
  type: "user",
  id: "user-test",
  name: "Мой творог",
  category: "user",
  aliases: [],
  calories: 120,
  protein: 18,
  fat: 5,
  carbs: 2,
  baseUnit: "g",
  units: [
    {
      key: "serving",
      kind: "serving",
      label: "порция",
      few: "порции",
      many: "порций",
      base: 150,
    },
    { key: "g", kind: "g", label: "г", base: 1 },
  ],
  servingOptions: [
    { amount: 1, unitKey: "serving" },
    { amount: 100, unitKey: "g" },
  ],
  defaultServing: { amount: 1, unitKey: "serving" },
  sourceType: "user",
  sourceName: "Пользователь",
  isBranded: false,
  brand: "Простоквашино",
  barcode: "4600103101019",
};

const lookup = (id: string) =>
  id === userProduct.id ? userProduct : getFoodById(id);

describe("nutrition: grams", () => {
  it("100 g of buckwheat equals the per-100 values", () => {
    expect(nutritionForServing(buckwheat, 100, "g")).toEqual({
      calories: 330,
      protein: 12.6,
      fat: 3.3,
      carbs: 62.1,
    });
  });

  it("200 g of buckwheat doubles the values", () => {
    expect(nutritionForServing(buckwheat, 200, "g").calories).toBe(660);
  });

  it("nutritionForBaseAmount scales per 100 base units", () => {
    expect(nutritionForBaseAmount(buckwheat, 150).calories).toBe(495);
  });
});

describe("nutrition: milliliters", () => {
  it("250 ml of milk uses the ml conversion", () => {
    const result = nutritionForServing(milk, 250, "ml");
    expect(result.calories).toBe(130);
    expect(result.protein).toBe(7);
  });

  it("100 ml of milk equals the per-100 values", () => {
    expect(nutritionForServing(milk, 100, "ml").calories).toBe(52);
  });
});

describe("nutrition: pieces", () => {
  it("1 egg (piece = 50 g) is 78.5 kcal", () => {
    expect(nutritionForServing(egg, 1, "piece").calories).toBe(78.5);
  });

  it("2 eggs equal 100 g and give the same nutrition as grams", () => {
    const byPieces = nutritionForServing(egg, 2, "piece");
    const byGrams = nutritionForServing(egg, 100, "g");
    expect(byPieces).toEqual(byGrams);
    expect(byPieces.calories).toBe(157);
  });

  it("fractional pieces work (1.35 banana)", () => {
    const result = nutritionForServing(banana, 1.35, "piece");
    expect(result.calories).toBe(144.2);
  });
});

describe("nutrition: servings (user products)", () => {
  it("1 порция of 150 g at 120 kcal/100g is 180 kcal", () => {
    const result = nutritionForServing(userProduct, 1, "serving");
    expect(result.calories).toBe(180);
    expect(result.protein).toBe(27);
  });

  it("works identically for generic, ml and user products", () => {
    // Same engine, no food-type-specific branches.
    expect(nutritionForServing(buckwheat, 100, "g").calories).toBe(330);
    expect(nutritionForServing(milk, 100, "ml").calories).toBe(52);
    expect(nutritionForServing(userProduct, 100, "g").calories).toBe(120);
  });
});

describe("resolution", () => {
  it("resolves a generic food entry", () => {
    const entry: FoodEntry = {
      id: "e1",
      foodId: "buckwheat",
      mealType: "breakfast",
      amount: 200,
      unit: "g",
      date: "2026-09-17",
    };
    const resolved = resolveFoodEntry(entry, lookup);
    expect(resolved?.food.id).toBe("buckwheat");
    expect(resolved?.food.type).toBe("generic");
    expect(nutritionForServing(resolved!.food, 200, "g").calories).toBe(660);
  });

  it("resolves a user product entry", () => {
    const entry: FoodEntry = {
      id: "e2",
      foodId: "user-test",
      foodType: "user",
      mealType: "lunch",
      amount: 1,
      unit: "serving",
      date: "2026-09-17",
    };
    const resolved = resolveFoodEntry(entry, lookup);
    expect(resolved?.food.type).toBe("user");
    expect(resolved?.food.name).toBe("Мой творог");
    expect(nutritionForServing(resolved!.food, 1, "serving").calories).toBe(180);
  });

  it("skips unknown food ids in batch resolution", () => {
    const entries: FoodEntry[] = [
      { id: "a", foodId: "egg", mealType: "breakfast", amount: 1, unit: "piece", date: "d" },
      { id: "b", foodId: "missing", mealType: "breakfast", amount: 1, unit: "g", date: "d" },
    ];
    const resolved = resolveEntries(entries, lookup);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].entry.id).toBe("a");
  });
});

describe("domain views", () => {
  it("nutritionOf returns the structured NutritionInfo", () => {
    expect(nutritionOf(egg)).toEqual({
      calories: 157,
      protein: 12.7,
      fat: 11.5,
      carbs: 0.7,
    });
  });

  it("sourceOf returns the structured FoodSource", () => {
    expect(sourceOf(userProduct)).toEqual({
      type: "user",
      name: "Пользователь",
      barcode: "4600103101019",
    });
    expect(sourceOf(buckwheat).type).toBe("generic");
  });

  it("sourceLabelOf speaks Russian", () => {
    expect(sourceLabelOf(buckwheat)).toBe("Справочные данные");
    expect(sourceLabelOf(userProduct)).toBe("Пользователь");
  });

  it("foodTypeOf discriminates products", () => {
    expect(foodTypeOf(buckwheat)).toBe("generic");
    expect(foodTypeOf(userProduct)).toBe("user");
  });

  it("servingsOf projects servings with equivalents", () => {
    const servings = servingsOf(egg);
    const onePiece = servings.find((s) => s.unit === "piece" && s.amount === 1);
    expect(onePiece).toBeDefined();
    expect(onePiece?.name).toBe("1 шт");
    expect(onePiece?.gramsEquivalent).toBe(50);

    const milkServings = servingsOf(milk);
    const glass = milkServings.find((s) => s.unit === "ml" && s.amount === 250);
    expect(glass?.millilitersEquivalent).toBe(250);
  });
});

describe("dry/cooked products stay separate", () => {
  it("rice dry and cooked are distinct records", () => {
    const dry = getFoodById("rice");
    const cooked = getFoodById("rice-cooked");
    expect(dry).toBeDefined();
    expect(cooked).toBeDefined();
    expect(dry!.id).not.toBe(cooked!.id);
    expect(dry!.calories).toBe(344);
    expect(cooked!.calories).toBe(130);
  });

  it("buckwheat dry and cooked are distinct records", () => {
    expect(getFoodById("buckwheat")!.calories).toBe(330);
    expect(getFoodById("buckwheat-cooked")!.calories).toBe(110);
  });

  it("pasta dry and cooked are distinct records", () => {
    expect(getFoodById("pasta")!.calories).toBe(350);
    expect(getFoodById("pasta-cooked")!.calories).toBe(135);
  });
});
