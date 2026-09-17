import { CalorieRing } from "@/components/dashboard/CalorieRing";
import { MacroStat } from "@/components/dashboard/NutritionCard";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { NutritionSummary, NutritionTargets } from "@/lib/types";

interface DailyNutritionProps {
  totals: NutritionSummary;
  targets: NutritionTargets;
}

/**
 * Dashboard hero: the calorie ring as the primary element with the
 * remaining amount right beneath it, and one cohesive macro overview
 * (three compact indicators) beside it.
 */
export function DailyNutrition({ totals, targets }: DailyNutritionProps) {
  const remaining = targets.calories - totals.calories;
  const over = remaining < 0;

  return (
    <Card className="p-5 sm:p-7">
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex shrink-0 flex-col items-center gap-4">
          <CalorieRing current={totals.calories} target={targets.calories} />
          <p
            className={
              over
                ? "rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-semibold tabular-nums text-red-600 dark:text-red-400"
                : "rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold tabular-nums text-primary"
            }
          >
            {over
              ? `Перерасход ${formatNumber(Math.abs(remaining))} ккал`
              : `Осталось ${formatNumber(remaining)} ккал`}
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-x-4 gap-y-5 sm:gap-x-6 lg:max-w-none lg:flex-1">
          <MacroStat
            label="Белки"
            current={totals.protein}
            target={targets.protein}
            color={totals.protein > targets.protein ? "danger" : "protein"}
            over={totals.protein > targets.protein}
          />
          <MacroStat
            label="Жиры"
            current={totals.fat}
            target={targets.fat}
            color={totals.fat > targets.fat ? "danger" : "fat"}
            over={totals.fat > targets.fat}
          />
          <MacroStat
            label="Углеводы"
            current={totals.carbs}
            target={targets.carbs}
            color={totals.carbs > targets.carbs ? "danger" : "carbs"}
            over={totals.carbs > targets.carbs}
          />
        </div>
      </div>
    </Card>
  );
}
