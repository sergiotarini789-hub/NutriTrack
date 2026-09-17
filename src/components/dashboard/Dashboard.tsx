import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { dailyTargets, meals, todayConsumed } from "@/lib/mock-data";
import { formatNumber } from "@/lib/format";
import { CalorieRing } from "./CalorieRing";
import { MealCard } from "./MealCard";
import { NutritionCard } from "./NutritionCard";

/** "Сегодня" dashboard: calorie ring, macros, meals and the add-food button. */
export function Dashboard() {
  const remaining = dailyTargets.calories - todayConsumed.calories;

  return (
    <div className="space-y-6">
      {/* Calories + macros */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="flex flex-col items-center gap-3">
            <CalorieRing
              current={todayConsumed.calories}
              target={dailyTargets.calories}
            />
            <p className="text-sm text-muted-foreground">
              Осталось:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatNumber(remaining)} ккал
              </span>
            </p>
          </div>

          <div className="hidden w-px self-stretch bg-border sm:block" />

          <div className="w-full space-y-5">
            <NutritionCard
              label="Белки"
              current={todayConsumed.protein}
              target={dailyTargets.protein}
              unit="г"
              color="protein"
            />
            <NutritionCard
              label="Жиры"
              current={todayConsumed.fat}
              target={dailyTargets.fat}
              unit="г"
              color="fat"
            />
            <NutritionCard
              label="Углеводы"
              current={todayConsumed.carbs}
              target={dailyTargets.carbs}
              unit="г"
              color="carbs"
            />
          </div>
        </div>
      </Card>

      {/* Meals */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Приёмы пищи</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            Итого: {formatNumber(todayConsumed.calories)} ккал
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </section>

      {/* Primary action (no real functionality yet) */}
      <Button size="lg" className="mx-auto w-full max-w-sm">
        <Plus className="h-5 w-5" />
        Добавить еду
      </Button>
    </div>
  );
}
