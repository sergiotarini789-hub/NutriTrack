"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useDiary } from "@/lib/diary";
import {
  dateKey,
  formatDayMonth,
  lastNDays,
  todayKey,
  weekdayLong,
  weekdayShort,
} from "@/lib/dates";
import { entriesForDate, nutritionOfEntries, resolveEntries } from "@/lib/nutrition";
import type { HistoryDayInfo } from "@/lib/types";
import { HistoryDayCard } from "./HistoryDayCard";
import { WeeklyOverview } from "./WeeklyOverview";

const HISTORY_DAYS = 7;

/** History screen built from the actual stored food entries. */
export function HistoryView() {
  const { ready, entries, targets } = useDiary();

  if (!ready) return <LoadingState />;

  const today = todayKey();
  const days: HistoryDayInfo[] = lastNDays(HISTORY_DAYS).map((date) => {
    const key = dateKey(date);
    const dayEntries = entriesForDate(entries, key);
    return {
      dateKey: key,
      label: formatDayMonth(date),
      weekdayLabel: weekdayLong(date),
      shortWeekday: weekdayShort(date),
      calories:
        dayEntries.length > 0
          ? nutritionOfEntries(resolveEntries(dayEntries)).calories
          : null,
      isToday: key === today,
    };
  });

  const hasData = days.some((day) => day.calories !== null);

  return (
    <>
      <PageHeader
        title="История"
        subtitle="Ваша динамика питания за последние дни"
      />

      {hasData ? (
        <div className="space-y-6">
          <WeeklyOverview days={days} target={targets.calories} />

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              По дням
            </h2>
            <Card className="divide-y divide-border">
              {[...days].reverse().map((day) => (
                <HistoryDayCard
                  key={day.dateKey}
                  day={day}
                  target={targets.calories}
                />
              ))}
            </Card>
          </section>
        </div>
      ) : (
        <Card className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-medium text-foreground">
            Пока нет данных
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Добавьте еду на странице «Сегодня», чтобы увидеть историю питания
          </p>
          <Link
            href="/today"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Перейти к «Сегодня»
          </Link>
        </Card>
      )}
    </>
  );
}
