import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { FoodItem } from "@/lib/types";

/** Food card with nutrition values per 100 g. */
export function FoodCard({ food }: { food: FoodItem }) {
  const Icon = food.icon;

  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
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
        <p className="text-xs text-muted-foreground">ккал / 100 г</p>
      </div>
    </Card>
  );
}
