"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useAppLaunch } from "@/components/app/AppLaunch";
import { AddFoodModal } from "@/components/nutrition/AddFoodModal";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { MEALS } from "@/lib/app-data";
import { useDiary } from "@/lib/diary";
import { formatDayMonth, todayKey, weekdayLong } from "@/lib/dates";
import { pluralize } from "@/lib/format";
import { todayGreeting } from "@/lib/greeting";
import {
  entriesForDate,
  entriesForMeal,
  nutritionOfEntries,
  resolveEntries,
} from "@/lib/nutrition";
import type { MealType } from "@/lib/types";
import { MealCard } from "./MealCard";
import { TodaySummary } from "./TodaySummary";

/** Stagger step: hidden until the launch moment, then a quick rise. */
function rise(launched: boolean, delayMs: number, extraClass = "") {
  const animated = launched ? "animate-rise" : "opacity-0";
  return {
    className: extraClass ? `${animated} ${extraClass}` : animated,
    style: launched ? { animationDelay: `${delayMs}ms` } : undefined,
  };
}

/**
 * "Сегодня" screen (Stage 10 redesign): a calm editorial page — small
 * greeting, compact nutrition summary directly on the background, and
 * MEALS as the core content. On mobile the floating add action (and
 * each meal's own add row) carry "Добавить еду"; on desktop a quiet
 * button closes the page. All values come from the real diary entries.
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

  function openAdd(meal: MealType | null) {
    setAddMeal(meal);
    setAddOpen(true);
  }

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Header: calm greeting + date (no uppercase eyebrow) */}
      <header {...rise(launched, 0)}>
        <p className="text-[13px] text-muted-foreground">
          {todayGreeting(profile?.name)}
        </p>
        <h1 className="mt-0.5 text-[22px] font-semibold tracking-tight text-foreground">
          Сегодня
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {formatDayMonth(date)} · {weekdayLong(date)}
        </p>
      </header>

      {/* Compact nutrition summary */}
      <div {...rise(launched, 60)}>
        <TodaySummary totals={totals} targets={targets} />
      </div>

      {/* Meals — the core of the screen */}
      <section {...rise(launched, 120)} aria-label="Приёмы пищи">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-foreground">
            Приёмы пищи
          </h2>
          {todayEntries.length > 0 && (
            <span className="text-[12px] tabular-nums text-muted-foreground">
              {mealsWithFood}{" "}
              {pluralize(
                mealsWithFood,
                "приём пищи",
                "приёма пищи",
                "приёмов пищи",
              )}{" "}
              · {todayEntries.length}{" "}
              {pluralize(todayEntries.length, "продукт", "продукта", "продуктов")}
            </span>
          )}
        </div>
        <div className="space-y-3">
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
              onAdd={() => openAdd(meal.id)}
            />
          ))}
        </div>
      </section>

      {/* Desktop: quiet page-level add (mobile uses the FAB) */}
      <div {...rise(launched, 180)} className="hidden lg:block">
        <Button
          variant="secondary"
          size="lg"
          className="mx-auto w-full max-w-xs rounded-full"
          onClick={() => openAdd(null)}
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
