"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { TodaySummary } from "@/components/dashboard/TodaySummary";
import { MEALS } from "@/lib/app-data";
import { addDays, dateKey, formatDayMonth, todayKey, weekdayLong } from "@/lib/dates";
import {
  entriesForDate,
  entriesForMeal,
  formatEntryAmount,
  hasNutrition,
  nutritionForServing,
  nutritionOfEntries,
  resolveEntries,
  type ResolvedEntry,
} from "@/lib/nutrition";
import { formatNumber } from "@/lib/format";
import type { LucideIcon } from "lucide-react";
import type { NutritionTargets } from "@/lib/types";
import { useDiary } from "@/lib/diary";

interface HistoryDayDetailProps {
  /** Selected day as a "YYYY-MM-DD" key. */
  dayKey: string;
  /** Current effective targets (Stage 9 semantics — never historical). */
  targets: NutritionTargets | null;
  onDayChange: (dayKey: string) => void;
  /** Returns to the day list (mobile only; desktop shows both). */
  onBackToList: () => void;
}

/**
 * Read-only details of one historical day (Stage 12): "Сегодня, but
 * read-only". Compact nutrition summary against the CURRENT effective
 * target (explicitly labelled — no historical target snapshots exist),
 * then the meals with their entries. No editing in this stage.
 */
export function HistoryDayDetail({
  dayKey: selectedDay,
  targets,
  onDayChange,
  onBackToList,
}: HistoryDayDetailProps) {
  const { entries, findFood } = useDiary();
  const date = new Date(
    Number(selectedDay.slice(0, 4)),
    Number(selectedDay.slice(5, 7)) - 1,
    Number(selectedDay.slice(8, 10)),
  );
  const isToday = selectedDay === todayKey();
  const prevDay = dateKey(addDays(date, -1));

  const dayEntries = entriesForDate(entries, selectedDay);
  const resolved = resolveEntries(dayEntries, findFood);
  const totals = nutritionOfEntries(resolved);

  return (
    <section
      aria-label={`День: ${formatDayMonth(date)}`}
      className="space-y-5 sm:space-y-6"
    >
      {/* Back to the day list (mobile hides the list while a day is open) */}
      <button
        type="button"
        onClick={onBackToList}
        className="-ml-2 flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
      >
        <ChevronLeft className="h-4 w-4" />
        Все дни
      </button>

      {/* Header + day navigation (never into the future) */}
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            {formatDayMonth(date)}
            {isToday && (
              <span className="ml-2 align-middle rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Сегодня
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {weekdayLong(date)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDayChange(prevDay)}
          aria-label="Предыдущий день"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onDayChange(dateKey(addDays(date, 1)))}
          aria-label="Следующий день"
          disabled={isToday}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {dayEntries.length === 0 ? (
        /* Honest empty day — no invented values */
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-foreground">
            Нет данных за этот день
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            В этот день не было записей в дневнике
          </p>
        </div>
      ) : (
        <>
          {/* Compact summary against the CURRENT effective target */}
          <TodaySummary totals={totals} targets={targets} profileHint={false} />
          {targets && (
            <p className="-mt-3 text-xs text-muted-foreground">
              Сравнение с текущей нормой
            </p>
          )}

          {/* Meals with entries */}
          <div className="space-y-3">
            {MEALS.map((meal) => {
              const mealEntries = resolveEntries(
                entriesForMeal(entries, selectedDay, meal.id),
                findFood,
              );
              if (mealEntries.length === 0) return null;
              return (
                <MealBlock
                  key={meal.id}
                  name={meal.name}
                  icon={meal.icon}
                  items={mealEntries}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

/** One read-only meal section: «Завтрак / 520 ккал» + entry rows. */
function MealBlock({
  name,
  icon: Icon,
  items,
}: {
  name: string;
  icon: LucideIcon;
  items: ResolvedEntry[];
}) {
  const totals = nutritionOfEntries(items);
  return (
    <section
      aria-label={name}
      className="overflow-hidden rounded-2xl bg-card shadow-sm shadow-black/[0.03]"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 sm:px-5">
        <Icon className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={2} />
        <h3 className="text-[15px] font-semibold text-foreground">{name}</h3>
        <p className="ml-auto shrink-0 text-[14px] tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            {formatNumber(Math.round(totals.calories))}
          </span>{" "}
          ккал
        </p>
      </div>
      <ul className="divide-y divide-border/50 border-t border-border/50 px-2 pb-1 sm:px-3">
        {items.map(({ entry, food }) => {
          const nutrition = nutritionForServing(food, entry.amount, entry.unit);
          return (
            <li
              key={entry.id}
              className="flex items-baseline justify-between gap-3 px-2 py-2.5 sm:px-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-medium text-foreground">
                  {food.name}
                </p>
                <p className="mt-px text-[12.5px] tabular-nums text-muted-foreground">
                  {formatEntryAmount(food, entry.amount, entry.unit)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {hasNutrition(food)
                  ? formatNumber(Math.round(nutrition.calories))
                  : "—"}
                {hasNutrition(food) && (
                  <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                    ккал
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
