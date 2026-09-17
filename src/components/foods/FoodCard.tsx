import { categoryIcon } from "@/lib/food-data";
import { formatNumber } from "@/lib/format";
import { baseUnitLabel } from "@/lib/nutrition";
import type { FoodItem } from "@/lib/types";

interface FoodCardProps {
  food: FoodItem;
  /** When provided, the card becomes a clickable button. */
  onClick?: () => void;
}

/** Food card with nutrition values per 100 g / 100 ml. */
export function FoodCard({ food, onClick }: FoodCardProps) {
  const Icon = categoryIcon(food.category);

  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-foreground">
          {food.name}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] text-muted-foreground">
          <span>
            <span className="font-semibold text-protein">Б</span>{" "}
            {formatNumber(food.protein)} г
          </span>
          <span>
            <span className="font-semibold text-fat">Ж</span>{" "}
            {formatNumber(food.fat)} г
          </span>
          <span>
            <span className="font-semibold text-carbs">У</span>{" "}
            {formatNumber(food.carbs)} г
          </span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-semibold tabular-nums text-foreground">
          {formatNumber(food.calories)}
        </p>
        <p className="text-xs text-muted-foreground">ккал / 100 {baseUnitLabel(food)}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      {content}
    </div>
  );
}
