"use client";

import { Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { nutritionForAmount, type ResolvedEntry } from "@/lib/nutrition";

interface MealFoodListProps {
  items: ResolvedEntry[];
  onDelete: (entryId: string) => void;
}

/** List of foods inside a meal with a delete control per item. */
export function MealFoodList({ items, onDelete }: MealFoodListProps) {
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-border">
      {items.map(({ entry, food }) => {
        const nutrition = nutritionForAmount(food, entry.amount);
        return (
          <li key={entry.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {food.name}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {formatNumber(entry.amount)} г
              </p>
            </div>
            <p className="shrink-0 text-sm tabular-nums text-foreground">
              <span className="font-semibold">
                {formatNumber(nutrition.calories)}
              </span>{" "}
              <span className="text-muted-foreground">ккал</span>
            </p>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              aria-label={`Удалить: ${food.name}`}
              title="Удалить"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
