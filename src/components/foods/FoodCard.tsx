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
 * Compact food row with a clear hierarchy: dominant product name,
 * secondary macro line and a subtle source note; the per-100 calorie
 * value sits on the right.
 */
export function FoodCard({ food, onClick }: FoodCardProps) {
  const Icon = categoryIcon(food.category);
  const isUser = food.sourceType === "user";
  const sourceLabel = isUser ? "Ваш продукт" : "Справочное значение";

  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1 py-px">
        <p className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold text-foreground">
            {food.name}
          </span>
          {isUser && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary">
              Ваш
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          <span className="font-semibold text-protein">Б</span>{" "}
          {formatNumber(food.protein ?? 0)} ·{" "}
          <span className="font-semibold text-fat">Ж</span>{" "}
          {formatNumber(food.fat ?? 0)} ·{" "}
          <span className="font-semibold text-carbs">У</span>{" "}
          {formatNumber(food.carbs ?? 0)}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {sourceLabel}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-bold tabular-nums tracking-tight text-foreground">
          {formatNumber(food.calories ?? 0)}
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
        className="flex w-full items-center gap-3.5 rounded-2xl bg-card p-3 text-left shadow-[0_1px_2px_rgba(8,15,10,0.05)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-primary/[0.04] hover:shadow-[0_2px_8px_rgba(8,15,10,0.07)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-3.5 dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
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
