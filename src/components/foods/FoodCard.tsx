import { categoryIcon } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import { baseUnitLabel } from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

interface FoodCardProps {
  food: FoodItem;
  /** When provided, the card becomes a clickable button. */
  onClick?: () => void;
}

/**
 * Compact food row: category icon, name (with a "Ваш" badge for
 * user-created products), macro line and the per-100 calorie value.
 */
export function FoodCard({ food, onClick }: FoodCardProps) {
  const Icon = categoryIcon(food.category);

  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium text-foreground">
            {food.name}
          </span>
          {food.sourceType === "user" && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
              Ваш
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          <span className="font-semibold text-protein">Б</span>{" "}
          {formatNumber(food.protein)} ·{" "}
          <span className="font-semibold text-fat">Ж</span>{" "}
          {formatNumber(food.fat)} ·{" "}
          <span className="font-semibold text-carbs">У</span>{" "}
          {formatNumber(food.carbs)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-bold tabular-nums text-foreground">
          {formatNumber(food.calories)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          ккал / 100 {baseUnitLabel(food)}
        </p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3.5 rounded-2xl bg-card p-3 text-left transition-[background-color,transform] duration-150 hover:bg-primary/[0.04] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-3.5"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-card p-3 sm:p-3.5">
      {content}
    </div>
  );
}
