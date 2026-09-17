import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { Meal } from "@/lib/types";

export function MealCard({ meal }: { meal: Meal }) {
  const Icon = meal.icon;
  const isEmpty = meal.calories === 0;

  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-foreground">{meal.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {meal.description}
        </p>
      </div>
      <p className="shrink-0 text-right">
        <span
          className={cn(
            "text-base font-semibold tabular-nums",
            isEmpty ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {formatNumber(meal.calories)}
        </span>{" "}
        <span className="text-[13px] text-muted-foreground">ккал</span>
      </p>
    </Card>
  );
}
