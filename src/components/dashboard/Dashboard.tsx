"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { DailyNutrition } from "@/components/nutrition/DailyNutrition";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { MEALS } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatDayMonth, todayKey } from "@/lib/dates";
import { formatNumber, pluralize } from "@/lib/format";
import {
  entriesForDate,
  entriesForMeal,
  nutritionOfEntries,
  resolveEntries,
} from "@/lib/nutrition";
import type { MealType } from "@/lib/types";
import { MealCard } from "./MealCard";

/**
 * "Сегодня" screen: calorie hero with the day's macro overview,
 * followed by the unified diary of meals. All values come from the
 * real diary entries.
 */
export function Dashboard() {
  const { ready, entries, targets, findFood } = useDiary();
  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<MealType | null>(null);
  const date = useMemo(() => new Date(), []);

  if (!ready) return <LoadingState />;

  const today = todayKey();
  const todayEntries = entriesForDate(entries, today);
  const totals = nutritionOfEntries(resolveEntries(todayEntries, findFood));
  const mealsWithFood = MEALS.filter(
    (meal) => entriesForMeal(entries, today, meal.id).length > 0,
  ).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="mb-1">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
          {formatDayMonth(date)}
        </p>
        <h1 className="mt-0.5 text-[26px] font-bold tracking-tight text-foreground lg:text-3xl">
          Сегодня
        </h1>
      </div>

      <DailyNutrition totals={totals} targets={targets} />

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Приёмы пищи
            </h2>
            {todayEntries.length > 0 && (
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {mealsWithFood}{" "}
                {pluralize(
                  mealsWithFood,
                  "приём пищи",
                  "приёма пищи",
                  "приёмов пищи",
                )}{" "}
                · {todayEntries.length}{" "}
                {pluralize(todayEntries.length, "продукт", "продукта", "продуктов")}
              </p>
            )}
          </div>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            Итого: {formatNumber(totals.calories)} ккал
          </span>
        </div>
        <Card className="divide-y divide-border/70 px-1.5 py-1.5 sm:px-2">
          {MEALS.map((meal) => (
            <MealCard
              key={meal.id}
              mealId={meal.id}
              name={meal.name}
              icon={meal.icon}
              items={resolveEntries(
                entriesForMeal(entries, today, meal.id),
                findFood,
              )}
              onAdd={() => {
                setAddMeal(meal.id);
                setAddOpen(true);
              }}
            />
          ))}
        </Card>
      </section>

      <Button
        size="lg"
        className="mx-auto w-full max-w-sm"
        onClick={() => {
          setAddMeal(null);
          setAddOpen(true);
        }}
      >
        <Plus className="h-5 w-5" />
        Добавить еду
      </Button>

      <AddFoodModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        preselectedMeal={addMeal}
      />
    </div>
  );
}
