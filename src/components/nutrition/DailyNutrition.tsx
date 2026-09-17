"use client";

import { CalorieRing } from "@/components/dashboard/CalorieRing";
import { MacroStat } from "@/components/dashboard/NutritionCard";
import { useAppLaunch } from "@/components/app/AppLaunch";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { NutritionSummary, NutritionTargets } from "@/lib/types";

interface DailyNutritionProps {
  totals: NutritionSummary;
  targets: NutritionTargets;
}

/**
 * Dashboard hero: the calorie ring as the centerpiece of the app —
 * large number, "ккал" unit, target beneath and the remaining amount
 * in a prominent pill — followed by one cohesive macro visualization
 * (three softly tinted indicators). The inner block is keyed on the
 * launch moment so the ring sweep, count-up and macro bars start
 * exactly when the Today screen becomes visible.
 */
export function DailyNutrition({ totals, targets }: DailyNutritionProps) {
  const { launched } = useAppLaunch();
  const remaining = targets.calories - totals.calories;
  const over = remaining < 0;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div
        key={launched ? "live" : "idle"}
        className="relative flex flex-col items-center gap-6 lg:flex-row lg:gap-12"
      >
        {/* Calorie status — the visual centerpiece */}
        <div className="relative flex shrink-0 flex-col items-center gap-4">
          {/* Soft accent glow hugging the ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -m-7 rounded-full bg-primary/[0.07] blur-2xl"
          />
          <CalorieRing current={totals.calories} target={targets.calories} />
          <p
            className={
              over
                ? "relative rounded-full bg-red-500/10 px-5 py-2 text-[15px] font-semibold tabular-nums text-red-600 dark:text-red-400"
                : "relative rounded-full bg-primary/10 px-5 py-2 text-[15px] font-semibold tabular-nums text-primary"
            }
          >
            {over
              ? `Перерасход ${formatNumber(Math.abs(remaining))} ккал`
              : `Осталось ${formatNumber(remaining)} ккал`}
          </p>
        </div>

        {/* Macros — one cohesive nutrition visualization */}
        <div className="grid w-full max-w-md grid-cols-3 gap-2.5 sm:gap-3 lg:max-w-none lg:flex-1">
          <MacroStat
            label="Белки"
            current={totals.protein}
            target={targets.protein}
            unit="г"
            color={totals.protein > targets.protein ? "danger" : "protein"}
            over={totals.protein > targets.protein}
          />
          <MacroStat
            label="Жиры"
            current={totals.fat}
            target={targets.fat}
            unit="г"
            color={totals.fat > targets.fat ? "danger" : "fat"}
            over={totals.fat > targets.fat}
          />
          <MacroStat
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
