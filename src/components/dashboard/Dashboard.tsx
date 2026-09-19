"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Plus } from "lucide-react";
import { useAppLaunch } from "@/components/app/AppLaunch";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { DailyNutrition } from "@/components/nutrition/DailyNutrition";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { MEALS } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatDayMonth, todayKey, weekdayLong } from "@/lib/dates";
import { formatNumber, pluralize } from "@/lib/format";
import { todayGreeting } from "@/lib/greeting";
import {
  entriesForDate,
  entriesForMeal,
  nutritionOfEntries,
  resolveEntries,
} from "@/lib/nutrition";
import type { MealType } from "@/lib/types";
import { MealCard } from "./MealCard";

/** Stagger step: hidden until the launch moment, then a quick rise. */
function rise(launched: boolean, delayMs: number, extraClass = "") {
  const animated = launched ? "animate-rise" : "opacity-0";
  return {
    className: extraClass ? `${animated} ${extraClass}` : animated,
    style: launched ? { animationDelay: `${delayMs}ms` } : undefined,
  };
}

/**
 * "Сегодня" screen: calorie hero with the day's macro overview,
 * followed by the unified diary of meals. Sections enter with a short
 * stagger after the launch sequence; all values come from the real
 * diary entries.
 */
export function Dashboard() {
  const { ready, entries, targets, profile, findFood } = useDiary();
  const { launched } = useAppLaunch();
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
      <div {...rise(launched, 0, "mb-1")}>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary">
          {todayGreeting(profile?.name)}
        </p>
        <h1 className="mt-0.5 text-[26px] font-bold tracking-tight text-foreground lg:text-3xl">
          Сегодня
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {formatDayMonth(date)} · {weekdayLong(date)}
        </p>
      </div>

      <div {...rise(launched, 70)}>
        {targets ? (
          <DailyNutrition totals={totals} targets={targets} />
        ) : (
          <Card className="p-5 sm:p-7">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calculator className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-foreground">
                  Заполните параметры профиля
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Чтобы рассчитать вашу дневную норму калорий.
                </p>
              </div>
              <Link
                href="/settings"
                className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-colors hover:bg-primary-hover"
              >
                Заполнить профиль
              </Link>
            </div>
          </Card>
        )}
      </div>

      <section {...rise(launched, 140)}>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Приёмы пищи
            </h2>
            {todayEntries.length > 0 ? (
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
            ) : (
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Начни свой день с первого приёма пищи.
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

      <div {...rise(launched, 210)}>
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
      </div>

      <AddFoodModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        preselectedMeal={addMeal}
      />
    </div>
  );
}
