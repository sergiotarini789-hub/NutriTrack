import {
  Banana,
  Drumstick,
  Egg,
  Fish,
  Milk,
  Soup,
  Wheat,
} from "lucide-react";
import type { FoodItem } from "./types";

/**
 * Local food database. Nutrition values are per 100 g.
 * Easy to extend: just add another entry.
 */
export const foods: FoodItem[] = [
  { id: "buckwheat", name: "Гречка", calories: 330, protein: 12.6, fat: 3.3, carbs: 62.1, icon: Wheat },
  { id: "rice", name: "Рис", calories: 344, protein: 6.7, fat: 0.7, carbs: 78.9, icon: Wheat },
  { id: "chicken-breast", name: "Куриная грудка", calories: 113, protein: 23.6, fat: 1.9, carbs: 0.4, icon: Drumstick },
  { id: "egg", name: "Яйцо", calories: 157, protein: 12.7, fat: 11.5, carbs: 0.7, icon: Egg },
  { id: "tuna", name: "Тунец", calories: 108, protein: 23.0, fat: 1.0, carbs: 0.0, icon: Fish },
  { id: "cottage-cheese", name: "Творог", calories: 121, protein: 17.2, fat: 5.0, carbs: 1.8, icon: Milk },
  { id: "oatmeal", name: "Овсянка", calories: 352, protein: 12.3, fat: 6.2, carbs: 61.8, icon: Soup },
  { id: "pasta", name: "Макароны", calories: 350, protein: 11.8, fat: 1.3, carbs: 73.3, icon: Wheat },
  { id: "mackerel", name: "Скумбрия", calories: 191, protein: 18.0, fat: 13.2, carbs: 0.0, icon: Fish },
  { id: "banana", name: "Банан", calories: 89, protein: 1.5, fat: 0.2, carbs: 21.5, icon: Banana },
];

const foodById = new Map(foods.map((food) => [food.id, food]));

export function getFoodById(id: string): FoodItem | undefined {
  return foodById.get(id);
}
