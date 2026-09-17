"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { DailyNutrition } from "@/components/nutrition/DailyNutrition";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { MEALS } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatFullDate, todayKey } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import {
  entriesForDate,
  entriesForMeal,
  nutritionOfEntries,
  resolveEntries,
} from "@/lib/nutrition";
import type { MealType } from "@/lib/types";
import { MealCard } from "./MealCard";

/** "Сегодня" dashboard driven by real diary data. */
export function Dashboard() {
  const { ready, entries, targets, findFood } = useDiary();
  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<MealType | null>(null);
  const date = useMemo(() => new Date(), []);

  if (!ready) return <LoadingState />;

  const today = todayKey();
  const totals = nutritionOfEntries(
    resolveEntries(entriesForDate(entries, today), findFood),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Сегодня" subtitle={formatFullDate(date)} />

      <DailyNutrition totals={totals} targets={targets} />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Приёмы пищи</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            Итого: {formatNumber(totals.calories)} ккал
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
        </div>
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
