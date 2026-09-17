import { CalorieRing } from "@/components/dashboard/CalorieRing";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { NutritionSummary, NutritionTargets } from "@/lib/types";

interface DailyNutritionProps {
  totals: NutritionSummary;
  targets: NutritionTargets;
}

/** Calories ring and macro progress bars for the current day. */
export function DailyNutrition({ totals, targets }: DailyNutritionProps) {
  const remaining = targets.calories - totals.calories;
  const over = remaining < 0;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <div className="flex flex-col items-center gap-3">
          <CalorieRing current={totals.calories} target={targets.calories} />
          <p className="text-sm text-muted-foreground">
            {over ? (
              <>
                Перерасход:{" "}
                <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {formatNumber(Math.abs(remaining))} ккал
                </span>
              </>
            ) : (
              <>
                Осталось:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatNumber(remaining)} ккал
                </span>
              </>
            )}
          </p>
        </div>

        <div className="hidden w-px self-stretch bg-border sm:block" />

        <div className="w-full space-y-5">
          <NutritionCard
            label="Белки"
            current={totals.protein}
            target={targets.protein}
            unit="г"
            color={totals.protein > targets.protein ? "danger" : "protein"}
            over={totals.protein > targets.protein}
          />
          <NutritionCard
            label="Жиры"
            current={totals.fat}
            target={targets.fat}
            unit="г"
            color={totals.fat > targets.fat ? "danger" : "fat"}
            over={totals.fat > targets.fat}
          />
          <NutritionCard
            label="Углеводы"
            current={totals.carbs}
            target={targets.carbs}
            unit="г"
            color={totals.carbs > targets.carbs ? "danger" : "carbs"}
            over={totals.carbs > targets.carbs}
          />
        </div>
      </div>
    </Card>
  );
}
